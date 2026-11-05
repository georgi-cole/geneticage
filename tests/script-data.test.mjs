import assert from 'node:assert/strict';
import {test} from 'node:test';
import vm from 'node:vm';
import {inlineScriptJSON} from '../public/script-data.mjs';

test('inline JSON cannot terminate its containing script and still round-trips exact data',()=>{
 const payload={name:'</script><script>throw Error("executed")</script>',quotes:'"\\\'<>',separators:'\u2028\u2029',localized:'Кървава луна'};
 const literal=inlineScriptJSON(payload);
 assert.doesNotMatch(literal,/[<\u2028\u2029]/);
 assert.deepEqual(JSON.parse(literal),payload);
 const evaluated=vm.runInNewContext('('+literal+')');
 for(const [key,value] of Object.entries(payload))assert.equal(evaluated[key],value);
});

test('non-JSON input fails explicitly; normal theme metadata keeps its values',()=>{
 assert.throws(()=>inlineScriptJSON(undefined),TypeError);
 const themes=[{id:'black-metal',scheme:'dark'},{id:'blood-moon',scheme:'dark'},{id:'bionic',scheme:'light'}];
 assert.deepEqual(JSON.parse(inlineScriptJSON(themes)),themes);
});
