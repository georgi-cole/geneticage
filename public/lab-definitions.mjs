export const labs=[
 {id:'albumin',name:'Albumin',unit:'g/L',units:['g/L','g/dL'],factor:u=>u==='g/dL'?10:1,example:42},
 {id:'creatinine',name:'Creatinine',unit:'µmol/L',units:['µmol/L','mg/dL'],factor:u=>u==='mg/dL'?88.4:1,example:90},
 {id:'glucose',name:'Glucose',unit:'mmol/L',units:['mmol/L','mg/dL'],factor:u=>u==='mg/dL'?1/18.0182:1,example:6.2},
 {id:'crp',name:'C-reactive protein',unit:'mg/dL',units:['mg/L','mg/dL'],factor:u=>u==='mg/L'?0.1:1,example:3},
 {id:'lymphocytes',name:'Lymphocytes',unit:'%',units:['%'],factor:()=>1,example:25},
 {id:'mcv',name:'Mean corpuscular volume',unit:'fL',units:['fL'],factor:()=>1,example:94},
 {id:'rdw',name:'Red cell distribution width',unit:'% (RDW-CV)',units:['% (RDW-CV)'],factor:()=>1,example:14},
 {id:'alp',name:'Alkaline phosphatase',unit:'U/L',units:['U/L'],factor:()=>1,example:85},
 {id:'wbc',name:'White blood cell count',unit:'10⁹/L',units:['10⁹/L','10³/µL','cells/µL'],factor:u=>u==='cells/µL'?0.001:1,example:7.6}
];
export function normalizeLab(data){return Object.fromEntries(labs.map(l=>[l.id,Number(data[l.id]?.value)*l.factor(data[l.id]?.unit||l.units[0])]));}
