// Source-pinned educational adult guide, separate from the PhenoAge formula.
// Updating this catalogue requires a new version; retain old versions for saved records.
export const REFERENCE_CATALOG_VERSION='abim-2026-01-v1';
export const REFERENCE_CATALOG_SOURCE='https://www.abim.org/media/e2wdwdqu/laboratory-reference-ranges.pdf';
export const referenceCatalog=Object.freeze({
 version:REFERENCE_CATALOG_VERSION,label:'ABIM · January 2026',url:REFERENCE_CATALOG_SOURCE,
 intervals:Object.freeze({
  albumin:{low:3.5,high:5.5,unit:'g/dL',page:1},
  creatinine:{female:{low:0.5,high:1.1},male:{low:0.7,high:1.3},unit:'mg/dL',page:5},
  glucose:{low:70,high:99,unit:'mg/dL',fasting:true,page:6},
  crp:{low:null,high:0.8,unit:'mg/dL',assay:'standard-crp',page:5},
  lymphocytes:{low:30,high:45,unit:'%',page:7},
  mcv:{low:80,high:98,unit:'fL',page:8},
  rdw:{low:9,high:14.5,unit:'% (RDW-CV)',page:10},
  alp:{low:30,high:120,unit:'U/L',page:1},
  wbc:{low:4000,high:11000,unit:'cells/µL',page:7}
 })
});

export const referenceModes=['published','lab-only'];
export const referenceGroups=['unspecified','female','male'];
export const crpAssays=['unspecified','standard-crp','hs-crp'];
