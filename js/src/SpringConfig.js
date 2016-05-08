var b3Friction1, b3Friction2, b3Friction3, b3Nobounce, frictionFromOrigamiValue, fromBouncinessAndSpeed, fromOrigamiTensionAndFriction, linearInterpolation, normalize, projectNormal, quadraticOutInterpolation, tensionFromOrigamiValue;

fromOrigamiTensionAndFriction = function(tension, friction) {
  return {
    tension: tensionFromOrigamiValue(tension),
    friction: frictionFromOrigamiValue(friction)
  };
};

fromBouncinessAndSpeed = function(bounciness, speed) {
  var b, friction, s, tension;
  b = normalize(bounciness / 1.7, 0, 20);
  b = projectNormal(b, 0, 0.8);
  s = normalize(speed / 1.7, 0, 20);
  tension = projectNormal(s, 0.5, 200);
  friction = quadraticOutInterpolation(b, b3Nobounce(tension), 0.01);
  return fromOrigamiTensionAndFriction(tension, friction);
};

module.exports = {
  fromOrigamiTensionAndFriction: fromOrigamiTensionAndFriction,
  fromBouncinessAndSpeed: fromBouncinessAndSpeed
};

tensionFromOrigamiValue = function(value) {
  return (value - 30) * 3.62 + 194;
};

frictionFromOrigamiValue = function(value) {
  return (value - 8) * 3 + 25;
};

normalize = function(value, startValue, endValue) {
  return (value - startValue) / (endValue - startValue);
};

projectNormal = function(n, start, end) {
  return start + (n * (end - start));
};

linearInterpolation = function(t, start, end) {
  return t * end + (1 - t) * start;
};

quadraticOutInterpolation = function(t, start, end) {
  return linearInterpolation(2 * t - t * t, start, end);
};

b3Friction1 = function(x) {
  return (0.0007 * Math.pow(x, 3)) - (0.006 * Math.pow(x, 2)) + (0.36 * x) + 2;
};

b3Friction2 = function(x) {
  return (0.000044 * Math.pow(x, 3)) - (0.006 * Math.pow(x, 2)) + (0.36 * x) + 2;
};

b3Friction3 = function(x) {
  return (0.00000045 * Math.pow(x, 3)) - (0.000332 * Math.pow(x, 2)) + (0.1078 * x) + 5.84;
};

b3Nobounce = function(tension) {
  if (tension <= 18) {
    return b3Friction1(tension);
  }
  if (tension <= 44) {
    return b3Friction2(tension);
  }
  return b3Friction3(tension);
};

//# sourceMappingURL=../../map/src/SpringConfig.map
