'use strict';

//allow audio and video settings
const constraints = {
  audio: true,
};

let stream = null;

//stream creating
navigator.mediaDevices.getUserMedia(constraints)
  .then((_stream) => {stream = _stream})
  .catch(e => {console.error(`Not allowed or not found: ${e}`)});

let chunks = [],
  audioBlob = null,
  mediaRecorder = null;

//just add year into footer
document.querySelector('footer').textContent += new Date().getFullYear();

//function 4 creation DOM elements
function createElement({
  tag = 'div',
  children,
  ...attributes
}) {
  const el = document.createElement(tag);

  //set attribute
  if (Object.keys(attributes).length) {
    Object.entries(attributes).forEach(([attr, val]) => {
      el.setAttribute(attr, val);
    })
  };

  //create children with recursion
  if (children && children.length) {
    children.forEach(elem => {
      el.append(createElement(elem));
    });
  };

  return el;
};

async function startRecord() {
  //check browser supporting
  if (!navigator.getUserMedia && !navigator.mediaDevices.getUserMedia) {
    console.warn('Recording not supported');
  };

  //change image on state of recording picture
  record_img.src = `img/${
    mediaRecorder && mediaRecorder.state === 'recording'
      ? 'microphone'
      : 'stop'
  }.png`;

  if (!mediaRecorder) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
  
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
  
      //when rec stop add data into chunks
      mediaRecorder.ondataavailable = event => {
        chunks.push(event.data);
      };
  
      //stop event handler
      mediaRecorder.onstop = mediaRecorderStop;
    } catch (error) {
      console.error(error);

      record_img.src = 'img/microphone.png';
    };
  } else {
    mediaRecorder.stop();
  };
};

function toggleClass(
    el, 
    oldClass, 
    newClass
  ) {
    el.classList.add(newClass);
    el.classList.remove(oldClass);
};

const audioBox = document.getElementById('audio_box');
function mediaRecorderStop() {
  //if we have recording, delete it
  if (audioBox.children[0]?.localName === 'audio') {
    audioBox.children[0].remove();
  };

  audioBlob = new Blob(
      chunks, 
      {type: 'audio/mp3'}
    );
  
  //link to audio blob file for recording
  const src = URL.createObjectURL(audioBlob);

  const audioElement = createElement({
      tag: 'audio', 
      src, 
      controls: true,
    });

  audioBox.append(audioElement);

  toggleClass(record_box, 'hide', 'show');

  mediaRecorder = null;
  chunks = [];
};

async function saveRecord() {
  const formData = new FormData();

  let audioName = prompt('Name?');
  audioName = audioName ? Date.now() + '-' + audioName : Date.now();

  formData.append('audio', audioBlob, audioName);

  try {
    await fetch('/save', {
      method: 'POSt',
      body: formData,
    });

    console.log('Saved!');

    resetRecord();
    fetchRecords();
  } catch (error) {
    console.error(error); 
  };
};

function resetRecord() {
  toggleClass(record_box, 'show', 'hide');
  audioBlob = null;
};

function removeRecord() {
  if (confirm('Sure?')) {
    resetRecord();
  };
};

//function 4 creating hard list of records elements
function createRecordElement(src) {
  const [date, audioName] = src
    .replace('.mp3', '')
    .split('-');

  const audioDate = new Date(+date).toLocaleString();

  return createElement({
    className: 'audio_item',
    children: [
      {
        tag: 'audio',
        src,
        onended: ({currentTarget}) => {
          currentTarget.parentElement.querySelector('img').src = 'img/play.png';
        },
      },
      {
        tag: 'button',
        className: 'btn',
        onclick: playRecord,
        children: [
          {
            tag: 'img',
            src: 'img/play.png',
          }
        ],
      },
      {
        tag: 'p',
        textContent: `${audioDate}${audioName ? ` - ${audioName}` : ''}`,
      },
    ],
  });
};

async function fetchRecords() {
  try {
    const filesF = await (await fetch('/records')).json();

    record_box.innerHTML = '';

    if (true) {
      filesF.forEach(file => {
        record_box.append(createRecordElement(file));
      });
    } else {
      record_box.append(createElement({
        tag: 'p',
        textContent: 'No records. Create one.',
      }));
    };
  } catch (error) {
    console.error(error);
  };
};

function currentTarget({currentTarget: playBtn}) {
  const audioEl = playBtn.previousSibling;

  if (audioEl.paused) {
    audioEl.play();

    audioEl.firstElementChild.src = 'img/pause.png';
  } else {
    audioEl.stop();

    audioEl.firstElementChild.src = 'img/play.png';
  };
};

record_btn.onclick = startRecord;
save_btn.onclick = saveRecord;
remove_btn.onclick = removeRecord;

fetchRecords();