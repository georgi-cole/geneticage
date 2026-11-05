export const CONTENT_VERSION='2026-11-04-science-v2';
export const references=[
 {id:'phenoage',label:'Levine et al. (2018) · Clinical PhenoAge and DNAm PhenoAge',url:'https://www.aging-us.com/article/101414/text'},
 {id:'validation',label:'Liu et al. (2018) · Clinical PhenoAge validation in US adults',url:'https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002718'},
 {id:'horvath',label:'Horvath (2013) · DNA methylation age',url:'https://doi.org/10.1186/gb-2013-14-10-r115'},
 {id:'grimage',label:'Lu et al. (2019) · GrimAge',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6366976/'},
 {id:'pace',label:'Belsky et al. (2022) · DunedinPACE',url:'https://elifesciences.org/articles/73420'},
 {id:'activity',label:'WHO · Physical activity',url:'https://www.who.int/initiatives/behealthy/physical-activity'},
 {id:'sleep',label:'CDC · Sleep duration and quality',url:'https://www.cdc.gov/sleep/about/index.html'},
 {id:'diet',label:'WHO · Healthy diet',url:'https://www.who.int/news-room/fact-sheets/detail/healthy-diet'},
 {id:'alcohol',label:'WHO · Alcohol and health',url:'https://www.who.int/news-room/fact-sheets/detail/alcohol/'},
 {id:'tobacco',label:'American Heart Association · Tobacco and cardiovascular health',url:'https://www.heart.org/en/healthy-living/healthy-lifestyle/lifes-essential-8'},
];
export const clockComparison=[
 {name:'Clinical PhenoAge',input:'Your age and nine routine blood measurements',meaning:'A clinical age estimate, expressed in years.',availability:'Calculated here when the required inputs and collection details are available.'},
 {name:'Horvath clock',input:'DNA methylation measurements from a suitable laboratory sample',meaning:'An epigenetic age estimate developed to track chronological age.',availability:'Requires a laboratory assay; not calculated from this questionnaire.'},
 {name:'DNAm PhenoAge',input:'DNA methylation measurements',meaning:'An epigenetic estimate trained to reflect a clinical aging measure.',availability:'A separate test from blood-based clinical PhenoAge.'},
 {name:'GrimAge',input:'DNA methylation measurements and the clock’s required supporting information',meaning:'A mortality-associated epigenetic measure expressed on an age scale. It is not a pace-of-aging score.',availability:'Requires laboratory testing and professional interpretation.'},
 {name:'DunedinPACE',input:'DNA methylation measurements from blood',meaning:'An estimate of the pace of biological aging, rather than an age in years.',availability:'Requires a suitable laboratory assay; serial routine blood tests do not reproduce it.'},
];
