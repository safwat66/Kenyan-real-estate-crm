import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const ConnectionStatus = ({ isConnected = false }) => (
  <div className="flex items-center space-x-2">
    {isConnected ? (
      <>
        <Wifi className="w-4 h-4 text-green-500" />
        <span className="text-sm text-green-600">Live</span>
      </>
    ) : (
      <>
        <WifiOff className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">Offline</span>
      </>
    )}
  </div>
);

export default ConnectionStatus;
