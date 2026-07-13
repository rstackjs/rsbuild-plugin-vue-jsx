import { defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginVue } from '@rsbuild/plugin-vue';
import { pluginVueJsx } from '@rsbuild/plugin-vue-jsx';
import { getRandomPort } from '@rstackjs/test-utils';

export default defineConfig({
  plugins: [
    pluginVue(),
    pluginVueJsx(),
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
    }),
  ],
  server: {
    port: await getRandomPort(),
  },
});
