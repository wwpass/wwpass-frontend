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

export { isClientKeyTicket, ticketAdapter };
