import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private readonly toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  success(message: string, title = 'Success') {
    return this.toast.fire({ icon: 'success', title, text: message });
  }

  error(message: string, title = 'Error') {
    return this.toast.fire({ icon: 'error', title, text: message });
  }

  info(message: string, title = 'Info') {
    return this.toast.fire({ icon: 'info', title, text: message });
  }

  warning(message: string, title = 'Warning') {
    return this.toast.fire({ icon: 'warning', title, text: message });
  }

  confirm(message: string, title = 'Are you sure?') {
    return Swal.fire({
      title,
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4fc3f7',
      cancelButtonColor: '#353535',
      background: '#1a1a1a',
      color: '#e5e2e1',
    });
  }

  loading(title = 'Please wait') {
    return Swal.fire({
      title,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
      background: '#1a1a1a',
      color: '#e5e2e1',
    });
  }

  close() {
    return Swal.close();
  }
}
