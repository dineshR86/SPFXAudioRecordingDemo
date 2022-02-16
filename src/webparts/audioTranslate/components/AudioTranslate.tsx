import * as React from 'react';
import styles from './AudioTranslate.module.scss';
import { IAudioTranslateProps, IAudioTranslateState } from './IAudioTranslateProps';
import { SPHttpClient,ISPHttpClientOptions,SPHttpClientResponse,MSGraphClient } from '@microsoft/sp-http';
import { Guid } from '@microsoft/sp-core-library';
import vmsg from "vmsg";
import { FilePicker, IFilePickerResult } from '@pnp/spfx-controls-react/lib/FilePicker';

const recorder:any = new vmsg.Recorder({
  wasmURL: "https://unpkg.com/vmsg@0.3.0/vmsg.wasm"
});


export default class AudioTranslate extends React.Component<IAudioTranslateProps, IAudioTranslateState> {

  public constructor(props:IAudioTranslateProps){
    super(props);
    this.state={
      isLoading:false,
      isRecording:false,
      recordings:[],
      blob:null,
      filePickerResult:[]
    }
  }

  record = async () => {
    this.setState({ isLoading: true });

    if (this.state.isRecording) {
      const blob = await recorder.stopRecording();
      // debugger;
      // console.log(blob);
      this.setState({
        isLoading: false,
        isRecording: false,
        recordings: this.state.recordings.concat(URL.createObjectURL(blob)),
        blob:blob
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

  upload=()=>{
    let spOpts:ISPHttpClientOptions={
      headers: {
        "Accept": "application/json",
        "Content-Type": "audio/mpeg"
      },
      body:this.state.blob
    }
    let url=`https://7q4xxq.sharepoint.com/sites/AudioRecordingDemo/_api/Web/Lists/getByTitle('Documents')/RootFolder/Files/Add(url='${Guid.newGuid()}.mp3', overwrite=true)`;
    this.props.context.spHttpClient.post(url,SPHttpClient.configurations.v1,spOpts).then((response:SPHttpClientResponse)=>{
      response.json().then((responsejson:JSON)=>{
        console.log(responsejson);
        this.postchatMessage(responsejson);
      })
    })
  }

  graphcall=()=>{
    let graphurl=`drives/b!L34207iJd0StziUDEoqXfdfCmsXjnplKh7g9AFyNguFAl4khfVcTT70F8klnSXFO/items/root:/test.txt:/content`
    this.props.context.msGraphClientFactory.getClient().then((client:MSGraphClient)=>{
      client.api(graphurl).version("v1.0").put("The content of the file goes here").then((data)=>{
        console.log(data);
      }).catch((err)=>{
        console.log(err);
      })
    });
  }

  toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

  postchatMessage=(respobj:any)=>{
    let chatmsgurl=`/chats/19:14da7990-1912-4a01-a4dd-f0d755c615f3_869e967c-2983-44b7-8618-d9c83c3543a4@unq.gbl.spaces/messages`;
    const msgObj={
      "body":{
        "contentType":"html",
        "content":`Heres the latest audio <attachment id=\"${respobj.UniqueId}\"></attachment>`
      },
      "attachments":[
        {
          "id":`${respobj.UniqueId}`,
          "contentType": "reference",
          "contentUrl": `https://7q4xxq.sharepoint.com${respobj.ServerRelativeUrl}`,
          "name":`${respobj.Name}`
        }
      ]
    }
    console.log(msgObj);
    this.props.context.msGraphClientFactory.getClient().then((client:MSGraphClient)=>{
      client.api(chatmsgurl).version("v1.0").header("Accept","application/json").post(msgObj).then((data)=>{
        console.log(data);
      }).catch((err)=>{
        console.log(err);
      })
    });
  }

  private _onFilePickerSave = async (filePickerResult: IFilePickerResult[]) => {
    this.setState({ filePickerResult: filePickerResult });
    if (filePickerResult && filePickerResult.length > 0) {
      for (var i = 0; i < filePickerResult.length; i++) {
        const item = filePickerResult[i];
        const fileResultContent = await item.downloadFileContent();
        console.log(fileResultContent);
        let spOpts:ISPHttpClientOptions={
          headers: {
            "Accept": "application/json",
            "Content-Type": fileResultContent.type
          },
          body:fileResultContent
        }
        let url=`https://7q4xxq.sharepoint.com/sites/AudioRecordingDemo/_api/Web/Lists/getByTitle('Documents')/RootFolder/Files/Add(url='${fileResultContent.name}', overwrite=true)`;
        this.props.context.spHttpClient.post(url,SPHttpClient.configurations.v1,spOpts).then((response:SPHttpClientResponse)=>{
          response.json().then((responsejson:JSON)=>{
            console.log(responsejson);
            this.postchatMessage(responsejson);
          })
        })
      }
    }
  }

  private _onImageFileUpload = async (filePickerResult: IFilePickerResult[]) => {
    this.setState({ filePickerResult: filePickerResult });
    if (filePickerResult && filePickerResult.length > 0) {
      for (var i = 0; i < filePickerResult.length; i++) {
        const item = filePickerResult[i];
        const fileResultContent = await item.downloadFileContent();
        console.log(fileResultContent);
        const imgbytes:any=await this.toBase64(fileResultContent)
        let chatmsgurl=`/chats/19:14da7990-1912-4a01-a4dd-f0d755c615f3_869e967c-2983-44b7-8618-d9c83c3543a4@unq.gbl.spaces/messages`;
    const msgObj={
      "body":{
        "contentType":"html",
        "content":"<div><div>\n<div><p>Inline Image:</p><span><img height=\"297\" src=\"../hostedContents/1/$value\" width=\"297\" style=\"vertical-align:bottom; width:297px; height:297px\"></span>\n\n</div>\n\n\n</div>\n</div>"
      },
      "hostedContents":[
        {
          "@microsoft.graph.temporaryId":"1",
          "contentBytes":imgbytes.replace("data:", "").replace(/^.+,/, ""),
          "contentType":"image/png"
        }
      ]
    }
    console.log(msgObj);
    this.props.context.msGraphClientFactory.getClient().then((client:MSGraphClient)=>{
      client.api(chatmsgurl).version("v1.0").header("Accept","application/json").post(msgObj).then((data)=>{
        console.log(data);
      }).catch((err)=>{
        console.log(err);
      })
    });
      }
    }
  }


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
                      <button onClick={this.upload}>
                        upload
                      </button>
                      {/* <button onClick={this.postchatMessage}>Graph call</button> */}
                      <ul style={{ listStyle: "none", padding: 0 }}>
                        {recordings.map(url => (
                          <li key={url}>
                            <audio src={url} controls />
                          </li>
                        ))}
                      </ul>

                      <FilePicker
                          label='Document Upload'
                          buttonIcon="FileImage"
                          onSave={this._onFilePickerSave}
                          onChange={(filePickerResult: IFilePickerResult[]) => { this.setState({filePickerResult }) }}
                          context={this.props.context}/>
                    
                    <FilePicker
                          label='ImageUpload'
                          accepts= {[".gif", ".jpg", ".jpeg", ".bmp", ".dib", ".tif", ".tiff", ".ico", ".png", ".jxr", ".svg"]}
                          buttonIcon="FileImage"
                          onSave={this._onImageFileUpload}
                          onChange={(filePickerResult: IFilePickerResult[]) => { this.setState({filePickerResult }) }}
                          context={this.props.context}/>    
                    </div>
                </div>
              </div>
            </div>
          </div>
        );
  }
}
