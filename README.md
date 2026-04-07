# @rsbuild/plugin-vue-jsx

Provides support for Vue 3 JSX / TSX syntax. This plugin internally integrates [@vue/babel-plugin-jsx](https://github.com/vuejs/babel-plugin-jsx).

> For Vue 2 projects, use [@rsbuild/plugin-vue2-jsx](https://github.com/rstackjs/rsbuild-plugin-vue2-jsx).

<p>
  <a href="https://npmjs.com/package/@rsbuild/plugin-vue-jsx">
   <img src="https://img.shields.io/npm/v/@rsbuild/plugin-vue-jsx?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  <a href="https://npmcharts.com/compare/@rsbuild/plugin-vue-jsx?minimal=true"><img src="https://img.shields.io/npm/dm/@rsbuild/plugin-vue-jsx.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
</p>

## Usage

Install:

```bash
npm add @rsbuild/plugin-vue-jsx @rsbuild/plugin-babel -D
```

Add plugin to your `rsbuild.config.ts`:

```ts
// rsbuild.config.ts
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginVue } from '@rsbuild/plugin-vue';
import { pluginVueJsx } from '@rsbuild/plugin-vue-jsx';

export default {
  plugins: [
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
    }),
    pluginVue(),
    pluginVueJsx(),
  ],
};
```

After registering the plugin, you can use Vue's [JSX / TSX syntax](https://github.com/vuejs/babel-plugin-jsx) in `.jsx`, `.tsx`, and `.vue` files.

Since the Vue JSX plugin relies on Babel for compilation, you need to additionally add the [@rsbuild/plugin-babel](https://rsbuild.rs/plugins/list/plugin-babel).

Babel compilation will introduce extra overhead, in the example above, we use `include` to match `.jsx` and `.tsx` files, thereby reducing the performance cost brought by Babel.

## Vue SFC

When using JSX in Vue SFC, you need to add `lang="jsx"` or `lang="tsx"` to the `<script>` tag.

- JSX:

```html title="App.vue"
<script lang="jsx">
  const vnode = <div>hello</div>;
</script>
```

- TSX:

```html title="App.vue"
<script lang="tsx">
  const vnode = <div>hello</div>;
</script>
```

## JSX Type Inference

When using Vue >= 3.3, please set `"jsxImportSource": "vue"` in `tsconfig.json` to enable JSX type inference.

```json title="tsconfig.json"
{
  "compilerOptions": {
    "jsxImportSource": "vue"
  }
}
```

For more details, see [Vue - JSX Type Inference](https://vuejs.org/guide/extras/render-function.html#jsx-type-inference).

## Options

If you need to customize the compilation behavior of Vue, you can use the following configs.

### vueJsxOptions

Options passed to `@vue/babel-plugin-jsx`, please refer to the [@vue/babel-plugin-jsx documentation](https://github.com/vuejs/babel-plugin-jsx) for detailed usage.

- **Type:**

```ts
type VueJSXPluginOptions = {
  /** transform `on: { click: someCallback }` to `onClick: someCallback` */
  transformOn?: boolean;
  /** enable optimization or not. */
  optimize?: boolean;
  /** merge static and dynamic class / style attributes / onSomething handlers */
  mergeProps?: boolean;
  /** configuring custom elements */
  isCustomElement?: (tag: string) => boolean;
  /** enable object slots syntax */
  enableObjectSlots?: boolean;
  /** Replace the function used when compiling JSX expressions */
  pragma?: string;
};
```

- **Default:** `{}`

- **Example:**

```ts
pluginVueJsx({
  vueJsxOptions: {
    transformOn: true,
  },
});
```

## License

[MIT](./LICENSE).
