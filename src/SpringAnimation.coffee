
{Animation} = require "Animated"

isDev = require "isDev"
Type = require "Type"

SpringConfig = require "./SpringConfig"

type = Type "SpringAnimation"

type.inherits Animation

type.defineOptions
  toValue: Number.isRequired
  velocity: Number.withDefault 0
  bounciness: Number
  speed: Number
  tension: Number
  friction: Number
  clamp: Boolean.withDefault no
  restDistance: Number.withDefault 0.01
  restVelocity: Number.withDefault 0.001

type.defineFrozenValues (options) ->

  toValue: options.toValue

  clamp: options.clamp

  restDistance: options.restDistance

  restVelocity: options.restVelocity

type.defineValues

  time: null

  value: null

  velocity: null

  startVelocity: null

  tension: null

  friction: null

type.initInstance (options) ->

  @value = @fromValue
  @velocity = @startVelocity = options.velocity

  spring = @_getSpringConfig options
  @tension = spring.tension
  @friction = spring.friction

type.defineMethods

  _getSpringConfig: (options) ->

    if options.bounciness? or options.speed?

      unless options.tension? or options.friction?
        throw Error "Cannot define bounciness or speed with tension or friction!"

      options.speed ?= 12
      options.bounciness ?= 8
      return SpringConfig.fromBouncinessAndSpeed options

    options.tension ?= 40
    options.friction ?= 7
    return SpringConfig.fromOrigamiTensionAndFriction options

  _shouldFinish: ->
    return no if @isDone
    if @clamp and @tension isnt 0
      if @fromValue < @toValue
        return yes if @value > @toValue
      return yes if @value < @toValue
    if Math.abs(@velocity) <= @restVelocity
      return Math.abs(@toValue - @value) <= @restDistance
    return no

type.overrideMethods

  _startAnimation: (animated) ->

    anim = @_previousAnimation
    if anim instanceof SpringAnimation
      @time = @startTime = anim.time
      @value = @fromValue = anim.value
      @velocity = @startVelocity = anim.velocity

    else
      if @fromValue?
      then animated._updateValue @fromValue
      else @fromValue = animated._value
      @value = @fromValue
      @time = @startTime = Date.now()

    @__onAnimationStart animated
    return

  __onAnimationStart: (animated) ->
    if @_useNativeDriver
    then @_startNativeAnimation animated
    else @_recomputeValue()

  __computeValue: ->
    {value, velocity} = this

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
      aAcceleration = @tension * (@toValue - tempValue) - @friction * tempVelocity
      tempValue = value + aVelocity * step / 2
      tempVelocity = velocity + aAcceleration * step / 2

      bVelocity = velocity
      bAcceleration = @tension * (@toValue - tempValue) - @friction * tempVelocity
      tempValue = value + bVelocity * step / 2
      tempVelocity = velocity + bAcceleration * step / 2

      cVelocity = velocity
      cAcceleration = @tension * (@toValue - tempValue) - @friction * tempVelocity
      tempValue = value + cVelocity * step / 2
      tempVelocity = velocity + cAcceleration * step / 2

      dVelocity = velocity
      dAcceleration = @tension * (@toValue - tempValue) - @friction * tempVelocity
      tempValue = value + dVelocity * step / 2
      tempVelocity = velocity + dAcceleration * step / 2

      dxdt = (aVelocity + 2 * (bVelocity + cVelocity) + dVelocity) / 6
      dvdt = (aAcceleration + 2 * (bAcceleration + cAcceleration) + dAcceleration) / 6

      value += dxdt * step
      velocity += dvdt * step

    if isDev
      @_assertNumber value
      @_assertNumber velocity

    @time = now
    @velocity = velocity
    return @value = value

  __onAnimationUpdate: (value) ->
    if @_shouldFinish()
      @stop yes
    return

  __onAnimationEnd: (finished) ->
    return unless finished
    return if @tension is 0
    @_onUpdate @toValue

  __captureFrame: ->
    {@time, @value, @velocity}

  __getNativeConfig: ->
    return {
      type: "spring"
      @toValue
      @startVelocity
      @clamp
      @tension
      @friction
      @restDistance
      @restVelocity
    }

module.exports = SpringAnimation = type.build()
