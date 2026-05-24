import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NgxSpinnerComponent } from 'ngx-spinner';
import { CardFooterComponent } from './shared/ui/card-footer/card-footer.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CardFooterComponent, NgxSpinnerComponent],
  templateUrl: './app.html'
})
export class App {
  private router = inject(Router);

  showFooter = signal(true);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event) => {
        this.showFooter.set(!event.urlAfterRedirects.startsWith('/app'));
      });
  }
}
