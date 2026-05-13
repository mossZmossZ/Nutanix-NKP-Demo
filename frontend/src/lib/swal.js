import Swal from 'sweetalert2'

const base = {
  confirmButtonColor: '#6b21a8',
  cancelButtonColor:  '#e5e7eb',
  customClass: {
    cancelButton: '!text-gray-700',
    popup: '!rounded-2xl !shadow-2xl',
    title: '!text-gray-900 !font-bold',
    htmlContainer: '!text-gray-500',
  },
}

export const toast = (icon, title, timer = 3000) =>
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    customClass: { popup: '!rounded-xl !shadow-lg' },
  })

export const toastSuccess = (msg)  => toast('success', msg)
export const toastError   = (msg)  => toast('error',   msg)
export const toastInfo    = (msg)  => toast('info',     msg)

export const confirmDelete = (itemName) =>
  Swal.fire({
    ...base,
    title: 'Delete ' + itemName + '?',
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete',
    confirmButtonColor: '#dc2626',
  })

export const confirm = (title, text, confirmText = 'Confirm') =>
  Swal.fire({
    ...base,
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
  })

export default Swal
