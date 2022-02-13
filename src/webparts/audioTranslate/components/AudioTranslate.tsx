import * as React from 'react';
import styles from './AudioTranslate.module.scss';
import { IAudioTranslateProps, IAudioTranslateState } from './IAudioTranslateProps';
import vmsg from "vmsg";

const recorder:any = new vmsg.Recorder({
  wasmURL: "https://unpkg.com/vmsg@0.3.0/vmsg.wasm"
});


export default class AudioTranslate extends React.Component<IAudioTranslateProps, IAudioTranslateState> {

  public constructor(props:IAudioTranslateProps){
    super(props);
    this.state={
      isLoading:false,
      isRecording:false,
      recordings:[]
    }
  }

  record = async () => {
    this.setState({ isLoading: true });

    if (this.state.isRecording) {
      const blob = await recorder.stopRecording();
      this.setState({
        isLoading: false,
        isRecording: false,
        recordings: this.state.recordings.concat(URL.createObjectURL(blob))
      });
    } else {
      try {
        await recorder.initAudio();
        await recorder.initWorker();
        recorder.startRecording();
        this.setState({ isLoading: false, isRecording: true });
      } catch (e) {
        console.error(e);
        this.setState({ isLoading: false });
      }
    }
  };


  public render(): React.ReactElement<IAudioTranslateProps> {
    const { isLoading, isRecording, recordings } = this.state;
        return (
          <div className={ styles.audioTranslate }>
            <div className={ styles.container }>
              <div className={ styles.row }>
                <div className={ styles.column }>
                  <span className={ styles.title }>Welcome to SharePoint!</span>
                  <p className={ styles.subTitle }>Customize SharePoint experiences using Web Parts.</p>
                    <div>
                      <button disabled={isLoading} onClick={this.record}>
                        {isRecording ? "Stop" : "Record"}
                      </button>
                      <ul style={{ listStyle: "none", padding: 0 }}>
                        {recordings.map(url => (
                          <li key={url}>
                            <audio src={url} controls />
                          </li>
                        ))}
                      </ul>
                    </div>
                </div>
              </div>
            </div>
          </div>
        );
  }
}
