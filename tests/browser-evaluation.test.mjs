import assert from 'node:assert/strict';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';
import {createBrowserEvaluator} from '../scripts/browser-evaluation.mjs';

test('browser evaluation keeps quotes, script tags and Unicode separators out of executable source',async()=>{
 const sent=[],context={executed:false};
 const page=async(method,params)=>{
  assert.equal(method,'Runtime.callFunctionOn');sent.push(params);
  const fn=runInNewContext('('+params.functionDeclaration+')',context);
  return {result:{value:await fn(...params.arguments.map(arg=>arg.value))}};
 };
 const evaluate=createBrowserEvaluator(page,42);
 for(const payload of ["');globalThis.executed=true;//",'</script><script>globalThis.executed=true</script>','` ${globalThis.executed=true} \\ " \u2028\u2029','6.1','[data-answer="sleep"]']){
  assert.equal(await evaluate(async value=>value,[payload]),payload);
  assert.equal(context.executed,false);
  assert.equal(sent.at(-1).arguments[0].value,payload);
  assert.ok(!sent.at(-1).functionDeclaration.includes(payload));
 }
 assert.equal(sent[0].executionContextId,42);assert.equal(sent[0].awaitPromise,true);assert.equal(sent[0].returnByValue,true);
});

test('browser evaluation preserves protocol errors, objects and explicit user gestures',async()=>{
 let params;
 const evaluate=createBrowserEvaluator(async(_method,options)=>{params=options;return {result:{value:{ready:true}}};},7);
 assert.deepEqual(await evaluate(()=>({ready:true}),[],true),{ready:true});assert.equal(params.userGesture,true);
 await assert.rejects(evaluate('untrusted source'),/Use a function/);
 assert.throws(()=>createBrowserEvaluator(()=>{},undefined),/current browser execution context/);
 const throwing=createBrowserEvaluator(async()=>({exceptionDetails:{exception:{description:'Invalid selector'}}}),7);
 await assert.rejects(throwing(()=>{}),/Invalid selector/);
});
