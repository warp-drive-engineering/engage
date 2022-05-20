import { action } from '@ember/object';
import Route from '@ember/routing/route';
import type RouterService from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import type IntlService from 'ember-intl/addon/services/intl';

declare global {
  interface Window {
    enUSTranslationsPromise: Promise<object>;
  }
}

export default class extends Route {
  @service declare intl: IntlService;
  @service declare router: RouterService;

  @tracked isInitialRender = true;

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

  @action
  didTransition() {
    if (this.isInitialRender) {
      this.isInitialRender = false;
      const one_second = 1000;
      const launchScreen = document.querySelector('#launch-screen');

      if (launchScreen) {
        launchScreen.setAttribute('aria-hidden', 'true');
        launchScreen.classList.add('hidden');
        // setTimeout(() => launchScreen.remove(), one_second);
      }
    }
  }
}
