import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSpinnerComponent } from 'ngx-spinner';
import { CardFooterComponent } from './shared/ui/card-footer/card-footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CardFooterComponent, NgxSpinnerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
