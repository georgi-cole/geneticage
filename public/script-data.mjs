// JSON is embedded in a <script> body by the pre-paint theme bootstrap.
// Escape HTML's tag delimiter as well as JavaScript line separators.
export function inlineScriptJSON(value){
 const json=JSON.stringify(value);
 if(json===undefined)throw new TypeError('Inline script data must be JSON-serializable.');
 return json.replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
}
