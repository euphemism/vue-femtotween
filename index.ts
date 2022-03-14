import { computed, reactive, Ref, ref, watch, WatchStopHandle } from "vue";

import { tween, tweenCallback } from "femtotween";

export {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
} from "femtotween";

export type { tweenCallback } from "femtotween";
export interface TweenOptions {
  /**
   * Time in ms for the tween - default: `400`
   */
  time?: number;

  /**
   * Callback function called when tweening is done.
   */
  done?: () => void;

  /**
   * Function used for easing - default: `easeInOutQuart`. See {@link https://github.com/pearofducks/femtoTween/blob/master/ease.js femtoTween easing functions}.
   */
  easeFunc?: (value: number) => number;

  /**
   * Optional transform/truncation of tweened value to a specified precision. See {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed Number.toFixed()}
   */
  precision?: number;
}

export type Stoppable = {
  stop: () => void;
};

export type TweenValue<T extends number | number[]> = Ref<T> & Stoppable;

const extendRefWithStop = <T extends number | number[]>(
  source: Ref<T>,
  stop: () => void
): TweenValue<T> => {
  return Object.defineProperty(source, "stop", {
    value: stop,
    enumerable: true,
    writable: true,
  }) as TweenValue<T>;
};

const setupTween = (
  from: number,
  to: number,
  options: TweenOptions,
  callback?: tweenCallback
): TweenValue<number> => {
  const tweeningValue = ref(from);

  const reactivityCallback = (newValue: number) => {
    const truncatedValue =
      null == options.precision
        ? newValue
        : Number.parseFloat(newValue.toFixed(options.precision));

    if (truncatedValue !== tweeningValue.value) {
      tweeningValue.value = truncatedValue;
    }

    callback?.(newValue);
  };

  const stop = tween(from, to, reactivityCallback, options);

  return extendRefWithStop(tweeningValue, stop as () => void);
};

const useTweenEx = (
  from: Ref<number>,
  to: Ref<number>,
  options: TweenOptions,
  callback?: (newValue: number) => void
): TweenValue<number> => {
  const tweenValue = ref(from.value) as TweenValue<number>;
  let innerTweenValue = ref(from.value) as TweenValue<number>;

  let innerTweenValueWatchHandler: WatchStopHandle;

  watch(
    [from, to],
    (value, oldValue, onCleanup) => {
      onCleanup(() => {
        innerTweenValueWatchHandler?.();

        tweenValue.stop?.();
      });

      innerTweenValue = setupTween(from.value, to.value, options, callback);
      tweenValue.stop = innerTweenValue.stop;

      innerTweenValueWatchHandler = watch(
        innerTweenValue,
        () => {
          tweenValue.value = innerTweenValue.value;
        },
        { immediate: true }
      );
    },
    { immediate: true }
  );

  return tweenValue;
};

const _useTween = (
  source: Ref<number>,
  options: TweenOptions,
  callback?: (newValue: number) => void
): TweenValue<number> => {
  const from = ref(source.value);
  const to = ref(source.value);

  let tweenedValue: TweenValue<number> | null = null;

  watch(
    source,
    () => {
      if (tweenedValue) {
        from.value = tweenedValue.value;
        to.value = source.value;
      }
    },
    { immediate: true }
  );

  tweenedValue = useTweenEx(from, to, options, callback);

  return tweenedValue;
};

/**
 * Composable to use {@link https://github.com/pearofducks/femtoTween femtoTween's} tween function in a (Vue 3 Composition API) reactive way
 *
 * @param source The Ref<number | number[]> off of which to trigger tweening
 * @param options Tweening options
 * @param callback Callback function that will be called on each tween-frame
 * @returns Ref that updates on each tween-frame; also exposes a 'stop' function to stop tweening
 */
export const useTween = <T extends number | number[]>(
  source: Ref<T>,
  options: TweenOptions,
  callback?: (newValue: number) => void
): TweenValue<T> => {
  if ("number" === typeof source.value) {
    return _useTween(source as Ref<number>, options, callback) as TweenValue<T>;
  }

  const sourceValues = source.value.map((value) => ref(value));

  const tweenedValues = reactive<TweenValue<number>[]>(
    sourceValues.map((value) => {
      return _useTween(value, options, callback);
    })
  );

  const unWrappedTweenedValues = computed<number[]>(() => {
    return tweenedValues.map((value) => value.value);
  });

  watch(
    source as Ref<number[]>,
    (newSources) => {
      newSources.forEach((value, index) => {
        sourceValues[index].value = value;
      });
    },
    { deep: true }
  );

  return extendRefWithStop(unWrappedTweenedValues, () => {
    tweenedValues.forEach((value) => {
      value.stop();
    });
  }) as TweenValue<T>;
};
