export function getKnownErrorResponse(error) {
  if (error?.message === 'D1 binding is not configured.') {
    return {
      status: 503,
      message: 'A ligacao com a base de dados D1 nao esta configurada.'
    };
  }

  const details = String(error?.message ?? '');

  if (/d1|sqlite|database is locked|no such table|cannot start a transaction within a transaction/i.test(details)) {
    return {
      status: 503,
      message: 'Nao foi possivel aceder a base de dados D1.',
      details: error.message
    };
  }

  if (/invalid birth date/i.test(details)) {
    return {
      status: 400,
      message: 'A data de nascimento informada e invalida.'
    };
  }

  if (/target age must be greater than current age/i.test(details)) {
    return {
      status: 400,
      message: 'A idade objetivo deve ser superior a idade atual.'
    };
  }

  if (/client name is required/i.test(details)) {
    return {
      status: 400,
      message: 'O nome do cliente e obrigatorio.'
    };
  }

  return null;
}