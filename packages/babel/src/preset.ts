import babel from '@babel/core';
import pluginDebugLabel from './plugin-debug-label';
import pluginReactRefresh from './plugin-react-refresh';
import type { PluginOptions } from './utils';

export default function ccstatePreset(_: typeof babel, options?: PluginOptions): { plugins: babel.PluginItem[] } {
  return {
    plugins: [
      [pluginDebugLabel, options],
      [pluginReactRefresh, options],
    ],
  };
}
