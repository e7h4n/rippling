export type GetEventData =
  | {
      state: 'begin';
      beginTime: DOMHighResTimeStamp;
    }
  | {
      state: 'hasData';
      data: unknown;
      beginTime: DOMHighResTimeStamp;
      endTime: DOMHighResTimeStamp;
    }
  | {
      state: 'hasError';
      error: unknown;
      beginTime: DOMHighResTimeStamp;
      endTime: DOMHighResTimeStamp;
    };

export type SetEventData =
  | {
      state: 'begin';
      args: unknown[];
      beginTime: DOMHighResTimeStamp;
    }
  | {
      state: 'hasData';
      data: unknown;
      args: unknown[];
      beginTime: DOMHighResTimeStamp;
      endTime: DOMHighResTimeStamp;
    }
  | {
      state: 'hasError';
      error: unknown;
      args: unknown[];
      beginTime: DOMHighResTimeStamp;
      endTime: DOMHighResTimeStamp;
    };

export type SubEventData =
  | {
      state: 'begin';
      callback: string;
      beginTime: DOMHighResTimeStamp;
    }
  | {
      state: 'end';
      callback: string;
      beginTime: DOMHighResTimeStamp;
      endTime: DOMHighResTimeStamp;
    };

export type UnsubEventData =
  | {
      state: 'begin';
      callback: string;
      beginTime: DOMHighResTimeStamp;
    }
  | {
      state: 'end';
      callback: string;
      beginTime: DOMHighResTimeStamp;
      endTime: DOMHighResTimeStamp;
    };

export interface MountEventData {
  time: DOMHighResTimeStamp;
}

export interface UnmountEventData {
  time: DOMHighResTimeStamp;
}
