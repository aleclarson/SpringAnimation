var Animation, SpringAnimation, SpringConfig, Type, getArgProp, type;

Animation = require("Animated").Animation;

getArgProp = require("getArgProp");

Type = require("Type");

SpringConfig = require("./SpringConfig");

type = Type("SpringAnimation");

type.inherits(Animation);

type.optionTypes = {
  endValue: Number,
  velocity: Number,
  bounciness: Number.Maybe,
  speed: Number.Maybe,
  tension: Number.Maybe,
  friction: Number.Maybe,
  clamp: Boolean,
  restDistance: Number,
  restVelocity: Number
};

type.optionDefaults = {
  clamp: false,
  restDistance: 0.01,
  restVelocity: 0.001
};

type.defineFrozenValues({
  endValue: getArgProp("endValue"),
  startVelocity: getArgProp("velocity"),
  clamp: getArgProp("clamp"),
  restDistance: getArgProp("restDistance"),
  restVelocity: getArgProp("restVelocity")
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
  this._tension = spring.tension;
  return this._friction = spring.friction;
});

type.defineMethods({
  getInternalState: function() {
    return {
      value: this.value,
      velocity: this.velocity,
      time: this.time
    };
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
      aAcceleration = this._tension * (this.endValue - tempValue) - this._friction * tempVelocity;
      tempValue = value + aVelocity * step / 2;
      tempVelocity = velocity + aAcceleration * step / 2;
      bVelocity = velocity;
      bAcceleration = this._tension * (this.endValue - tempValue) - this._friction * tempVelocity;
      tempValue = value + bVelocity * step / 2;
      tempVelocity = velocity + bAcceleration * step / 2;
      cVelocity = velocity;
      cAcceleration = this._tension * (this.endValue - tempValue) - this._friction * tempVelocity;
      tempValue = value + cVelocity * step / 2;
      tempVelocity = velocity + cAcceleration * step / 2;
      dVelocity = velocity;
      dAcceleration = this._tension * (this.endValue - tempValue) - this._friction * tempVelocity;
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
    var isRestingDistance, isRestingVelocity, shouldClamp;
    if (!this.hasEnded) {
      return;
    }
    shouldClamp = false;
    if (this.clamp && this._tension !== 0) {
      if (this.startValue < this.endValue) {
        shouldClamp = this.value > this.endValue;
      } else {
        shouldClamp = this.value < this.endValue;
      }
    }
    if (shouldClamp) {
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
    if (this._tension === 0) {
      return;
    }
    return this._onUpdate(this.endValue);
  }
});

module.exports = SpringAnimation = type.build();

//# sourceMappingURL=../../map/src/SpringAnimation.map
