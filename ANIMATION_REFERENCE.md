#  Animation Reference - Complete Guide

All animation techniques used in the Enhanced Stream View with code examples.

---

## GSAP Animations

### Container Entrance Animation

\\\	ypescript
gsap.from(containerRef.current, {
  duration: 0.4,
  opacity: 0,
  ease: 'power2.out'
});
\\\

Result: Smooth fade-in effect  
Duration: 0.4 seconds  

---

## Three.js 3D Animations

### Score Box Rotation

\\\	ypescript
scoreBox1.box.rotation.x += 0.005;
scoreBox1.box.rotation.z += 0.003;
\\\

Result: 3D boxes rotate smoothly  
Speed: 0.005 radians per frame  

---

## Key Animation Properties

| Effect | Duration | Property |
|--------|----------|----------|
| Fade in | 0.4s | opacity |
| Slide up | 0.6s | transform.y |
| Zoom | 0.8s | scale |
| Pulse | 1.5s | scale |
| Rotate | infinite | rotation |

---

## Performance Tips

 Use requestAnimationFrame for 3D
 Cleanup animations on unmount
 Use GPU-accelerated properties
 Lazy load effects for non-live streams
 Keep durations under 1 second

---

**Version**: 1.0  
**Last Updated**: January 4, 2026
