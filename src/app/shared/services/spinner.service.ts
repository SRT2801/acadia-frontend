import { Injectable, inject } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
  providedIn: 'root',
})
export class SpinnerService {
  private readonly spinner = inject(NgxSpinnerService);

  show(name = 'primary') {
    return this.spinner.show(name);
  }

  hide(name = 'primary') {
    return this.spinner.hide(name);
  }
}
