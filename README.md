# vue-femtotween

This is a small wrapper over the [femtotween](https://www.npmjs.com/package/femtotween) tweening package to expose it as a Vue 3 Composition API composable that works with Vue `Ref`s.

## Installation

```
npm install vue-femtotween
```

```js
import { useTween } from "vue-femtotween";
```

## Usage

The package exposes a single entrypoint function, `useTween`, as well as re-exporting the [easing functions](https://github.com/pearofducks/femtoTween/blob/master/ease.js) offered by `femtoTween`.

```ts
const useTween: <T extends number | number[]>(
  source: Ref<T>,
  options: TweenOptions,
  callback?: ((newValue: number) => void) | undefined
) => TweenValue<T>;
```

- `source` is a `Ref` either containing a `number` or a `number[]`.

  - `Ref<number>`: Changing the value will result in tweening from whatever the current tweening value is, to the new target value.
  - `Ref<number[]>`: Changing the value at an individual index tweens it independently from other values in the array.

- `TweenOptions` are as follows:

  ```ts
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
  ```

  With the exception of `precision`, these are the same options passed to `femtoTween`'s `tween` function. `precision` is added as a convenience feature.

- `callback` is an optional callback function that can be passed in, and will be called with the new tween value at each tween frame.

- The return value type is `TweenValue<T>` which is defined as:

  ```ts
  export type Stoppable = {
    stop: () => void;
  };

  export type TweenValue<T extends number | number[]> = Ref<T> & Stoppable;
  ```

  Essentially, just a `Ref` that also has a `stop` function exposed.

  The `Ref` returned from `useTween` will update its value as tweening progresses. Calling `stop` stops the active tween. Changing the `source`'s value will result in a new tween to the new target value.

## Example

```ts
import { defineComponent, ref } from "vue";

import { linear, useTween } from "vue-femtotween";

const source = ref(0);

const tweenValue = useTween(source, {
  easeFunc: linear,
  time: 1000,
  precision: 0,
});
```

`tweenValue` is a reactive value that updates at each tween frame. Changing the value of `source` results in a new tween, causing `tweenValue` to tween to the new target. These `Ref`s could then be used in a component template:

```html
<div style="width: 10em">
  <div>
    <div>tweenValue - {{ tweenValue }}</div>

    <progress :value="tweenValue / 1000" max="1" style="width: 100%" />
  </div>

  <input v-model="source" min="0" max="1000" type="range" style="width: 100%" />
</div>
```
