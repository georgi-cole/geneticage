import {clinicalCoverArt,clinicalPageContent,clinicalRecordGroups,hasClinicalFolio} from './report-clinical.mjs';
import {FAMILY_FOLIO_VERSION,familyCoverArt,familyPalette} from './report-family-art.mjs';
import {familyPageContent} from './report-family-folio.mjs';

export const isFamilyFolio=editorial=>['assessment-folio-v1','assessment-folio-v2',FAMILY_FOLIO_VERSION].includes(editorial?.folio?.version);
export const hasReportFolio=editorial=>isFamilyFolio(editorial)||hasClinicalFolio(editorial);

export function reportFolioArt(editorial){
 return isFamilyFolio(editorial)?familyCoverArt(editorial.type):clinicalCoverArt(editorial.folio);
}

export function reportFolioPalette(editorial){
 return isFamilyFolio(editorial)?familyPalette(editorial.type):{accent:'#843D3F',paper:'#FBF8F2',cover:'#F4EEE5',soft:'#EEE7DF'};
}

export function reportFolioPage(editorial,page){
 return isFamilyFolio(editorial)?familyPageContent(editorial,page):clinicalPageContent(editorial,page);
}

export function reportFolioRecord(editorial){
 if(!isFamilyFolio(editorial))return clinicalRecordGroups(editorial);
 const rows=editorial.record;
 const prefix=editorial.type+'.inputs.';
 return {
  blood:rows.filter(row=>row.measurement),
  collection:[],
  answers:rows.filter(row=>row.id.startsWith('answers.')||row.id.startsWith(prefix)&&!row.measurement),
  outputs:rows.filter(row=>row.id.includes('.result.')||row.id.includes('.review.')),
  alerts:rows.filter(row=>row.id.startsWith('safety-')),
 };
}
