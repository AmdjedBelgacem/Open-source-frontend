import React, { Fragment, createElement, forwardRef } from 'react';

const MOTION_ONLY_PROPS = new Set([
  'initial',
  'animate',
  'exit',
  'variants',
  'transition',
  'whileHover',
  'whileTap',
  'whileFocus',
  'whileInView',
  'viewport',
  'layout',
  'layoutId',
  'drag',
  'dragConstraints',
  'dragElastic',
  'dragMomentum',
  'custom',
  'onAnimationStart',
  'onAnimationComplete',
  'onUpdate',
  'onViewportEnter',
  'onViewportLeave',
]);

function stripMotionProps(props) {
  const nextProps = {};
  Object.entries(props || {}).forEach(([key, value]) => {
    if (!MOTION_ONLY_PROPS.has(key)) {
      nextProps[key] = value;
    }
  });
  return nextProps;
}

const motionCache = new Map();

function getMotionComponent(tagName) {
  if (motionCache.has(tagName)) {
    return motionCache.get(tagName);
  }

  const MotionLiteComponent = forwardRef(function MotionLiteComponent(props, ref) {
    return createElement(tagName, { ref, ...stripMotionProps(props) });
  });

  MotionLiteComponent.displayName = `motion.${String(tagName)}`;
  motionCache.set(tagName, MotionLiteComponent);
  return MotionLiteComponent;
}

export const motion = new Proxy(
  {},
  {
    get(_target, tagName) {
      return getMotionComponent(tagName);
    },
  },
);

export function AnimatePresence({ children }) {
  return createElement(Fragment, null, children);
}
