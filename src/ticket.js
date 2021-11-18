const isClientKeyTicket = (ticket) => {
  const [info] = ticket.split('@');

  const spnameFlagsOTP = info.split(':');
  if (spnameFlagsOTP.length < 3) {
    return false;
  }

  const FLAGS_INDEX = 1; // second element of ticket — flags
  const flags = spnameFlagsOTP[FLAGS_INDEX];

  return flags.split('').some((element) => element === 'c');
};

const getShortTicketForm = (ticket) => {
  const SHORT_TICKET_LENGTH = 8; // bytes
  const infoHost = ticket.split('@');
  const spnameFlagsOTP = infoHost[0].split(':');
  const otp = spnameFlagsOTP[spnameFlagsOTP.length - 1];
  return `${spnameFlagsOTP[0]}:${spnameFlagsOTP.length === 3 ? `${spnameFlagsOTP[1]}:` : ''}${otp.substr(0, SHORT_TICKET_LENGTH * 2)}@${infoHost[1]}`;
};

const ticketAdapter = (response) => {
  if (response && response.data) {
    const ticket = {
      ticket: response.data,
      ttl: response.ttl || 120
    };
    delete ticket.data;
    return ticket;
  }

  return response;
};

export { isClientKeyTicket, ticketAdapter, getShortTicketForm };
