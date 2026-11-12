// Repository-owned functions are code. Selectors, fixture values and page-read
// identifiers travel only as CDP argument values, never as JavaScript source.
export function createBrowserEvaluator(page,executionContextId){
 if(!Number.isInteger(executionContextId))throw TypeError('A current browser execution context is required.');
 return async(fn,values=[],userGesture=false)=>{
  if(typeof fn!=='function'||!Array.isArray(values))throw TypeError('Use a function and separate argument values.');
  const result=await page('Runtime.callFunctionOn',{
   functionDeclaration:fn.toString(),executionContextId,
   arguments:values.map(value=>({value})),awaitPromise:true,returnByValue:true,userGesture,
  });
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
  return result.result.value;
 };
}
