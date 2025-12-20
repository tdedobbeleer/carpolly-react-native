import { useRef } from 'react';
import { funnyMessages } from '../constants/funnyMessages';

export const useFunnyMessages = () => {
  const funnyMessagesRef = useRef<{ [driverId: string]: string }>({});

  const getFunnyMessage = (driverId: string) => {
    if (!funnyMessagesRef.current[driverId]) {
      funnyMessagesRef.current[driverId] = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
    }
    return funnyMessagesRef.current[driverId];
  };

  return { getFunnyMessage };
};