import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * האם המשתמש ביקש לצמצם תנועה במערכת ההפעלה.
 *
 * מי שסובל מרגישות לתנועה מכבה את זה ברמת המכשיר, ואנימציה שמתעלמת
 * מההגדרה הזו היא לא קישוט אלא מטרד. כל אנימציה באפליקציה עוברת דרך
 * הערך הזה, וכשהוא דולק המצב הסופי מוצג מיד בלי מעבר.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => active && setReduced(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      sub?.remove?.();
    };
  }, []);

  return reduced;
}
