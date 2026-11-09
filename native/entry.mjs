import '@capacitor/app';
import '@capacitor/browser';
import {configureReportExport} from '../public/report-export.mjs';
import {saveReportPdf} from './report-pdf.mjs';
import '../public/app.mjs';

configureReportExport(saveReportPdf);
