import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import type IntlService from 'ember-intl/services/intl';

declare global {
  interface Window {
    enUSTranslationsPromise: Promise<object>;
  }
}

export default class extends Route {
  @service declare intl: IntlService;

  async beforeModel() {
    // this is setup in index.html for eager kick-off
    // TODO if another locale is selected by the user, await the load of it instead
    // TODO if a user's locale can be determined upfront AND we support it's translation
    // we should have eagerly loaded it instead of en-us
    const translations = await window.enUSTranslationsPromise;
    this.intl.addTranslations('en-US', translations);
    this.intl.setLocale('en-US');
    document.querySelector('#launch-screen')!.remove();
  }
}
