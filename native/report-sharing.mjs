import {Filesystem} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {registerNativePdfDelivery} from '../public/report-download.mjs';
import {nativePdfDelivery} from '../public/report-native-share.mjs';
registerNativePdfDelivery(nativePdfDelivery({filesystem:Filesystem,share:Share}));
