var Animation, SpringAnimation, SpringConfig, Type, type;

Animation = require("Animated").Animation;

Type = require("Type");

SpringConfig = require("./SpringConfig");

type = Type("SpringAnimation");

type.inherits(Animation);

type.defineOptions({
  endValue: Number.isRequired,
  velocity: Number.isRequired,
  bounciness: Number,
  speed: Number,
  tension: Number,
  friction: Number,
  clamp: Boolean.withDefault(false),
  restDistance: Number.withDefault(0.01),
  restVelocity: Number.withDefault(0.001)
});

type.defineFrozenValues(function(options) {
  return {
    endValue: options.endValue,
    startVelocity: options.velocity,
    clamp: options.clamp,
    restDistance: options.restDistance,
    restVelocity: options.restVelocity
  };
});

type.defineValues({
  time: null,
  value: null,
  velocity: null,
  tension: null,
  friction: null
});

type.initInstance(function(options) {
  var spring;
  if ((options.bounciness != null) || (options.speed != null)) {
    assert((options.tension === void 0) && (options.friction === void 0), {
      reason: "Must only define 'bounciness & speed' or 'tension & friction'!"
    });
    spring = SpringConfig.fromBouncinessAndSpeed(options.bounciness != null ? options.bounciness : options.bounciness = 8, options.speed != null ? options.speed : options.speed = 12);
  } else {
    spring = SpringConfig.fromOrigamiTensionAndFriction(options.tension != null ? options.tension : options.tension = 40, options.friction != null ? options.friction : options.friction = 7);
  }
  this.tension = spring.tension;
  return this.friction = spring.friction;
});

type.defineMethods({
  getInternalState: function() {
    return {
      value: this.value,
      velocity: this.velocity,
      time: this.time
    };
  },
  _shouldClamp: function() {
    if (this.clamp && this.tension !== 0) {
      if (this.startValue < this.endValue) {
        return this.value > this.endValue;
      }
      return this.value < this.endValue;
    }
    return false;
  }
});

type.overrideMethods({
  __didStart: function() {
    var internalState;
    if (this.__previousAnimation instanceof SpringAnimation) {
      internalState = this.__previousAnimation.getInternalState();
      this.time = internalState.time;
      this.value = internalState.value;
      this.velocity = internalState.velocity;
    } else {
      this.time = this.startTime;
      this.value = this.startValue;
    }
    if (this.startVelocity != null) {
      this.velocity = this.startVelocity;
    }
    return this._recomputeValue();
  },
  __computeValue: function() {
    var MAX_STEPS, TIMESTEP_MSEC, aAcceleration, aVelocity, bAcceleration, bVelocity, cAcceleration, cVelocity, dAcceleration, dVelocity, dvdt, dxdt, i, j, now, numSteps, ref, ref1, step, tempValue, tempVelocity, value, velocity;
    ref = this, value = ref.value, velocity = ref.velocity;
    tempValue = value;
    tempVelocity = velocity;
    MAX_STEPS = 64;
    now = Date.now();
    if (now > this.time + MAX_STEPS) {
      now = this.time + MAX_STEPS;
    }
    TIMESTEP_MSEC = 1;
    numSteps = Math.floor((now - this.time) / TIMESTEP_MSEC);
    for (i = j = 0, ref1 = numSteps; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
      step = TIMESTEP_MSEC / 1000;
      aVelocity = velocity;
      aAcceleration = this.tension * (this.endValue - tempValue) - this.friction * tempVelocity;
      tempValue = value + aVelocity * step / 2;
      tempVelocity = velocity + aAcceleration * step / 2;
      bVelocity = velocity;
      bAcceleration = this.tension * (this.endValue - tempValue) - this.friction * tempVelocity;
      tempValue = value + bVelocity * step / 2;
      tempVelocity = velocity + bAcceleration * step / 2;
      cVelocity = velocity;
      cAcceleration = this.tension * (this.endValue - tempValue) - this.friction * tempVelocity;
      tempValue = value + cVelocity * step / 2;
      tempVelocity = velocity + cAcceleration * step / 2;
      dVelocity = velocity;
      dAcceleration = this.tension * (this.endValue - tempValue) - this.friction * tempVelocity;
      tempValue = value + dVelocity * step / 2;
      tempVelocity = velocity + dAcceleration * step / 2;
      dxdt = (aVelocity + 2 * (bVelocity + cVelocity) + dVelocity) / 6;
      dvdt = (aAcceleration + 2 * (bAcceleration + cAcceleration) + dAcceleration) / 6;
      value += dxdt * step;
      velocity += dvdt * step;
    }
    this.time = now;
    this.value = value;
    this.velocity = velocity;
    return value;
  },
  __didUpdate: function(value) {
    var isRestingDistance, isRestingVelocity;
    if (this.hasEnded) {
      return;
    }
    if (this._shouldClamp()) {
      return this.finish();
    }
    isRestingVelocity = Math.abs(this.velocity) <= this.restVelocity;
    isRestingDistance = Math.abs(this.endValue - this.value) <= this.restDistance;
    if (isRestingVelocity && isRestingDistance) {
      return this.finish();
    }
  },
  __didEnd: function(finished) {
    if (!finished) {
      return;
    }
    if (this.tension === 0) {
      return;
    }
    return this._onUpdate(this.endValue);
  }
});

module.exports = SpringAnimation = type.build();

//# sourceMappingURL=map/SpringAnimation.map
