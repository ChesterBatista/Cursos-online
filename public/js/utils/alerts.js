import Swal from '/node_modules/sweetalert2/dist/sweetalert2.esm.all.min.js';

const configuracaoBase = {
  confirmButtonColor: '#315f2c',
  cancelButtonColor: '#64748b',
  buttonsStyling: true,
  customClass: {
    popup: 'mc-swal-popup',
    title: 'mc-swal-title',
    htmlContainer: 'mc-swal-text',
    confirmButton: 'mc-swal-confirm',
    cancelButton: 'mc-swal-cancel',
  },
};

export function mostrarErro(mensagem, titulo = 'Algo não saiu como esperado') {
  return Swal.fire({
    ...configuracaoBase,
    icon: 'error',
    title: titulo,
    text: mensagem,
    confirmButtonText: 'Entendi',
  });
}

export function mostrarSucesso(mensagem, titulo = 'Tudo certo!') {
  return Swal.fire({
    ...configuracaoBase,
    icon: 'success',
    title: titulo,
    text: mensagem,
    confirmButtonText: 'Continuar',
    timer: 2200,
    timerProgressBar: true,
  });
}

export function mostrarAviso(mensagem, titulo = 'Atenção') {
  return Swal.fire({
    ...configuracaoBase,
    icon: 'warning',
    title: titulo,
    text: mensagem,
    confirmButtonText: 'Entendi',
  });
}

export async function confirmarAcao({
  titulo = 'Confirmar ação?',
  mensagem,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  perigosa = false,
}) {
  const resultado = await Swal.fire({
    ...configuracaoBase,
    icon: 'warning',
    title: titulo,
    text: mensagem,
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: textoCancelar,
    confirmButtonColor: perigosa ? '#b91c1c' : configuracaoBase.confirmButtonColor,
    reverseButtons: true,
    focusCancel: perigosa,
  });

  return resultado.isConfirmed;
}

export function mostrarToast(mensagem, icon = 'success') {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title: mensagem,
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
    customClass: {
      popup: 'mc-swal-toast',
    },
  });
}
