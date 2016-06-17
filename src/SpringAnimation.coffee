
{ Animation } = require "Animated"

getArgProp = require "getArgProp"
Type = require "Type"

SpringConfig = require "./SpringConfig"

type = Type "SpringAnimation"

type.inherits Animation

type.optionTypes =
  endValue: Number
  velocity: Number
  bounciness: Number.Maybe
  speed: Number.Maybe
  tension: Number.Maybe
  friction: Number.Maybe
  clamp: Boolean
  restDistance: Number
  restVelocity: Number

type.optionDefaults =
  clamp: no
  restDistance: 0.01
  restVelocity: 0.001

type.defineFrozenValues

  endValue: getArgProp "endValue"

  startVelocity: getArgProp "velocity"

  clamp: getArgProp "clamp"

  restDistance: getArgProp "restDistance"

  restVelocity: getArgProp "restVelocity"

type.defineValues

  time: null

  value: null

  velocity: null

  tension: null

  friction: null

type.initInstance (options) ->

  if options.bounciness? or options.speed?

    assert (options.tension is undefined) and (options.friction is undefined),
      reason: "Must only define 'bounciness & speed' or 'tension & friction'!"

    spring = SpringConfig.fromBouncinessAndSpeed(
      options.bounciness ?= 8
      options.speed ?= 12
    )

  else
    spring = SpringConfig.fromOrigamiTensionAndFriction(
      options.tension ?= 40
      options.friction ?= 7
    )

  @_tension = spring.tension
  @_friction = spring.friction

type.defineMethods

  getInternalState: ->
    { @value, @velocity, @time }

type.overrideMethods

  __didStart: ->

    if @__previousAnimation instanceof SpringAnimation
      internalState = @__previousAnimation.getInternalState()
      @time = internalState.time
      @value = internalState.value
      @velocity = internalState.velocity

    else
      @time = @startTime
      @value = @startValue

    if @startVelocity?
      @velocity = @startVelocity

    @_recomputeValue()

  __computeValue: ->

    { value, velocity } = this

    tempValue = value
    tempVelocity = velocity

    # If for some reason we lost a lot of frames
    # (e.g. process large payload or stopped in the debugger),
    # we only advance by 4 frames worth of computation and will
    # continue on the next frame. It's better to have it running at
    # faster speed than jumping to the end.
    MAX_STEPS = 64
    now = Date.now()
    if now > @time + MAX_STEPS
      now = @time + MAX_STEPS

    # We are using a fixed time step and a maximum number of iterations.
    # The following link explains how to build this loop:
    # http://gafferongames.com/game-physics/fix-your-timestep/
    TIMESTEP_MSEC = 1
    numSteps = Math.floor (now - @time) / TIMESTEP_MSEC

    for i in [ 0 ... numSteps ]

      # Velocity is based on seconds instead of milliseconds
      step = TIMESTEP_MSEC / 1000

      # The following link explains how RK4 works:
      # http://gafferongames.com/game-physics/integration-basics/
      aVelocity = velocity
      aAcceleration = @_tension * (@endValue - tempValue) - @_friction * tempVelocity
      tempValue = value + aVelocity * step / 2
      tempVelocity = velocity + aAcceleration * step / 2

      bVelocity = velocity
      bAcceleration = @_tension * (@endValue - tempValue) - @_friction * tempVelocity
      tempValue = value + bVelocity * step / 2
      tempVelocity = velocity + bAcceleration * step / 2

      cVelocity = velocity
      cAcceleration = @_tension * (@endValue - tempValue) - @_friction * tempVelocity
      tempValue = value + cVelocity * step / 2
      tempVelocity = velocity + cAcceleration * step / 2

      dVelocity = velocity
      dAcceleration = @_tension * (@endValue - tempValue) - @_friction * tempVelocity
      tempValue = value + dVelocity * step / 2
      tempVelocity = velocity + dAcceleration * step / 2

      dxdt = (aVelocity + 2 * (bVelocity + cVelocity) + dVelocity) / 6
      dvdt = (aAcceleration + 2 * (bAcceleration + cAcceleration) + dAcceleration) / 6

      value += dxdt * step
      velocity += dvdt * step

    @time = now
    @value = value
    @velocity = velocity

    return value

  __didUpdate: (value) ->

    # A listener might have stopped us in '_onUpdate'.
    return unless @hasEnded

    shouldClamp = no
    if @clamp and @_tension isnt 0
      if @startValue < @endValue
        shouldClamp = @value > @endValue
      else shouldClamp = @value < @endValue

    if shouldClamp
      return @finish()

    isRestingVelocity = Math.abs(@velocity) <= @restVelocity
    isRestingDistance = Math.abs(@endValue - @value) <= @restDistance
    if isRestingVelocity and isRestingDistance
      return @finish()

  __didEnd: (finished) ->
    return unless finished
    return if @_tension is 0
    @_onUpdate @endValue

module.exports = SpringAnimation = type.build()
