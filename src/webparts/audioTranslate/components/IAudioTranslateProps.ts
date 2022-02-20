import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IFilePickerResult } from "@pnp/spfx-controls-react/lib/FilePicker";

export interface IAudioTranslateProps {
  description: string;
  context:WebPartContext;
}

export interface IAudioTranslateState{
  isLoading: boolean,
    isRecording: boolean,
    recordings: any[],
    blob:any,
    filePickerResult:IFilePickerResult[],
    msgs:any[]
}
