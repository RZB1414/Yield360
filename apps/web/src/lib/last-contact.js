import { formatDate } from './formatters.js';

function startOfDay(date) {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return normalizedDate;
}

export function getLastContactStatus(lastContactAt) {
  if (!lastContactAt) {
    return {
      label: 'Sem contato registrado',
      colorClass: 'bg-slate/35',
      daysSinceContact: null,
      priority: 3,
      filterKey: 'missing',
      formattedDate: 'Ultimo contato: nao informado',
      daysLabel: 'Dias sem contato: nao informado'
    };
  }

  const contactDate = new Date(lastContactAt);

  if (Number.isNaN(contactDate.getTime())) {
    return {
      label: 'Data invalida',
      colorClass: 'bg-slate/35',
      daysSinceContact: null,
      priority: 3,
      filterKey: 'missing',
      formattedDate: 'Ultimo contato: data invalida',
      daysLabel: 'Dias sem contato: indisponivel'
    };
  }

  const dayInMs = 24 * 60 * 60 * 1000;
  const daysSinceContact = Math.max(0, Math.floor((startOfDay(new Date()) - startOfDay(contactDate)) / dayInMs));

  if (daysSinceContact < 15) {
    return {
      label: 'Contato recente',
      colorClass: 'bg-[#30b45d]',
      daysSinceContact,
      priority: 2,
      filterKey: 'green',
      formattedDate: `Ultimo contato: ${formatDate(lastContactAt)}`,
      daysLabel: `Dias sem contato: ${daysSinceContact}`
    };
  }

  if (daysSinceContact <= 45) {
    return {
      label: 'Acompanhar contato',
      colorClass: 'bg-[#e0b631]',
      daysSinceContact,
      priority: 1,
      filterKey: 'yellow',
      formattedDate: `Ultimo contato: ${formatDate(lastContactAt)}`,
      daysLabel: `Dias sem contato: ${daysSinceContact}`
    };
  }

  return {
    label: 'Contato atrasado',
    colorClass: 'bg-[#d65454]',
    daysSinceContact,
    priority: 0,
    filterKey: 'red',
    formattedDate: `Ultimo contato: ${formatDate(lastContactAt)}`,
    daysLabel: `Dias sem contato: ${daysSinceContact}`
  };
}

export function sortPlansByLastContact(plans = []) {
  return [...plans].sort((leftPlan, rightPlan) => {
    const leftStatus = getLastContactStatus(leftPlan.lastContactAt);
    const rightStatus = getLastContactStatus(rightPlan.lastContactAt);

    if (leftStatus.priority !== rightStatus.priority) {
      return leftStatus.priority - rightStatus.priority;
    }

    if ((leftStatus.daysSinceContact ?? -1) !== (rightStatus.daysSinceContact ?? -1)) {
      return (rightStatus.daysSinceContact ?? -1) - (leftStatus.daysSinceContact ?? -1);
    }

    return new Date(rightPlan.updatedAt ?? 0).getTime() - new Date(leftPlan.updatedAt ?? 0).getTime();
  });
}