import { C } from "./theme";

export const globalStyles = `
  *, *::before, *::after { 
    box-sizing: border-box; 
    margin: 0; 
    padding: 0; 
  }
  
  body { 
    background: ${C.bg}; 
  }
  
  ::-webkit-scrollbar { 
    width: 5px; 
  }
  
  ::-webkit-scrollbar-track { 
    background: transparent; 
  }
  
  ::-webkit-scrollbar-thumb { 
    background: ${C.borderDark}; 
    border-radius: 10px; 
  }
  
  @keyframes cardIn { 
    from { 
      opacity: 0; 
      transform: translateY(12px) scale(0.98); 
    } 
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    } 
  }
  
  @keyframes slideUp { 
    from { 
      opacity: 0; 
      transform: translateY(10px); 
    } 
    to { 
      opacity: 1; 
      transform: translateY(0); 
    } 
  }
  
  @keyframes fadeIn { 
    from { 
      opacity: 0; 
    } 
    to { 
      opacity: 1; 
    } 
  }
  
  @keyframes pulse { 
    0%, 100% { 
      transform: scale(1); 
    } 
    50% { 
      transform: scale(1.15); 
    } 
  }
`;
