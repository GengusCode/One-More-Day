import assert from 'node:assert/strict';
import {createDefaultState} from '../js/core/state.js';
import {createRenderer} from '../js/ui/render.js';
const root={html:'',addEventListener(){},removeEventListener(){},set innerHTML(v){this.html=v;},get innerHTML(){return this.html;}};
createRenderer({root,dispatch(){}}).render(createDefaultState(),{screen:'setup',hasSave:false});
assert.doesNotMatch(root.html,/Enter at least 2 characters/,'new players should not see an error before entering anything');
assert.match(root.html,/Make money\. Handle the unexpected/);
assert.match(root.html,/cover__play-hooks/);
console.log('start screen: welcoming form, game promise and play hooks passed');
