import { NgModule } from '@angular/core';
import { BrowseListComponent } from './browse-list/browse-list.component';
import { BrowseCardComponent } from './browse-card/browse-card.component';

// Bundles the browse components so a feature pulls them in with one import.
// They're standalone, so import + re-export them here.
@NgModule({
  imports: [BrowseListComponent, BrowseCardComponent],
  exports: [BrowseListComponent, BrowseCardComponent],
})
export class BrowseModule {}
