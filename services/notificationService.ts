export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("Este browser não suporta notificações desktop");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const sendNativeNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    const options = {
      body: body,
      icon: 'https://via.placeholder.com/128/aa0000/ffffff?text=R', // Placeholder logo
      vibrate: [200, 100, 200],
      requireInteraction: true
    };
    new Notification(title, options);
  }
};