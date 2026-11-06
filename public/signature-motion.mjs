const endpoints=[
 ['M33 6C70 17 73 28 52 42C30 56 33 68 67 80C42 61 41 57 60 45C87 28 70 13 33 6Z','M36 2C12 20 85 30 64 43C38 59 18 65 62 82C9 68 31 57 55 42C78 29 9 18 36 2Z'],
 ['M67 6C30 17 27 28 48 42C70 56 67 68 33 80C58 61 59 57 40 45C13 28 30 13 67 6Z','M64 2C88 20 15 30 36 43C62 59 82 65 38 82C91 68 69 57 45 42C22 29 91 18 64 2Z']
];
export function signaturePaths(progress){
 const t=Math.max(0,Math.min(1,progress));
 return endpoints.map(([final,initial])=>{
  if(t===1)return final;if(t===0)return initial;
  const from=initial.match(/-?\d+(?:\.\d+)?/g).map(Number);let i=0;
  return final.replace(/-?\d+(?:\.\d+)?/g,n=>{const a=from[i++];return (a+(Number(n)-a)*t).toFixed(3);});
 });
}
export function paintSignature(node,progress){
 const paths=signaturePaths(progress);
 ['.signature-rear','.signature-front'].forEach((selector,i)=>node.querySelector(selector)?.setAttribute('d',paths[i]));
}
