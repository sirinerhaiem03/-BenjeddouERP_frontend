/**
 * Barrel d'exports des composants partagés (Shared Module).
 * Importez ces éléments directement dans vos composants standalone.
 *
 * Usage dans un composant Angular :
 *   import { NombreLettresPipe } from '@shared/pipes/nombre-lettres.pipe';
 *   import { SmartDatepickerComponent } from '@shared/components/smart-datepicker/smart-datepicker.component';
 *   import { SmartAutocompleteComponent } from '@shared/components/smart-autocomplete/smart-autocomplete.component';
 *   import { DictionnaireWidgetComponent } from '@shared/components/dictionnaire-widget/dictionnaire-widget.component';
 *   import { GlobalSearchComponent } from '@shared/components/global-search/global-search.component';
 *   import { UtilsService } from '@shared/services/utils.service';
 *   import { FormValidatorService } from '@shared/services/form-validator.service';
 */

// Services
export { UtilsService }         from './services/utils.service';
export { FormValidatorService } from './services/form-validator.service';

// Pipes
export { NombreLettresPipe } from './pipes/nombre-lettres.pipe';

// Composants
export { GlobalSearchComponent }       from './components/global-search/global-search.component';
export { SmartAutocompleteComponent }  from './components/smart-autocomplete/smart-autocomplete.component';
export { SmartDatepickerComponent }    from './components/smart-datepicker/smart-datepicker.component';
export { DictionnaireWidgetComponent } from './components/dictionnaire-widget/dictionnaire-widget.component';
