vulcan_recorder = (function () {
    let audio_mime_type;
    let ios = false;
    let stream;
    let get_audio_data;
    let buffer_length;

    const draw_audio_visualizer = function (parent, width, height, buffer_length) {
        const rows = Math.ceil(Math.sqrt(buffer_length));
        const min_dimension = Math.min(width, height) - 10;
        const block_size = min_dimension / rows;
        const block_margin = block_size * 0.1;

        const freq_blocks = [];
        for (let i = 0; i < rows; ++i) {
            for (let j = 0; j < rows; ++j) {
                // draw div
                const block = document.createElement("div");
                block.classList.add("block");
                block.style.width = `${block_size - block_margin * 2}px`;
                block.style.height = `${block_size - block_margin * 2}px`;
                block.style.top = `${5 + i * block_size + block_margin}px`;
                block.style.left = `${5 + j * block_size + block_margin}px`;
                parent.appendChild(block);
                freq_blocks.push(block);
            }
        }

        return function (dataArray) {
            for (let i = 0; i < buffer_length; ++i) {
                const data = dataArray != null ? dataArray[i] : 0;
                const opacity = Math.min(1.0, data / 128.0);
                freq_blocks[i].style.opacity = opacity;
            }
        };
    };

    const format_seconds = function (seconds) {
        const minutes = Math.floor(seconds / 60);
        const seconds_remainder = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, "0")}:${seconds_remainder.toString().padStart(2, "0")}`;
    };

    class Recorder_control {
        constructor(visualizer, duration_displayer, stream, audio_mime_type, ios, get_audio_data, buffer_length, max_seconds) {
            this.media_recorder = new MediaRecorder(stream);
            this.is_recording = false;
            this.recorded_chunks = [];
            this.data_blob = null;
            this.sound_getter = get_audio_data;
            this.milliseconds = 0;
            this.max_millis = max_seconds * 1000;
            this.media_recorder.addEventListener(
                "dataavailable",
                function (e) {
                    if (e.data.size > 0) {
                        this.recorded_chunks.push(e.data);
                    } else {
                    }
                }.bind(this)
            );
            this.media_recorder.addEventListener(
                "stop",
                function () {
                    this.data_blob = new Blob(this.recorded_chunks, { type: audio_mime_type });
                }.bind(this)
            );
            this.visualizer_thread = null;
            this.duration_displayer = duration_displayer;

            const container_rect = visualizer.getBoundingClientRect();
            const computed_style = getComputedStyle(visualizer);
            const width = container_rect.width - parseFloat(computed_style.paddingLeft) - parseFloat(computed_style.paddingRight);
            const height = container_rect.height - parseFloat(computed_style.paddingTop) - parseFloat(computed_style.paddingBottom);
            const margin = { top: 10, right: 10, bottom: 10, left: 10 };

            this.set_visualize_data = draw_audio_visualizer(visualizer, width, height, buffer_length);
        }

        start() {
            if (this.is_recording) {
                return;
            }
            this.media_recorder.start();
            this.is_recording = true;
            this.visualizer_thread = setInterval(
                function () {
                    this.milliseconds += 100;
                    if (this.milliseconds >= this.max_millis) {
                        this.stop();
                        return;
                    }
                    const data = this.sound_getter();
                    this.set_visualize_data(data);
                    this.duration_displayer(this.milliseconds / 1000);
                }.bind(this),
                100
            );
        }

        stop() {
            if (!this.is_recording) {
                return;
            }
            this.media_recorder.stop();
            this.is_recording = false;
            clearInterval(this.visualizer_thread);
            this.set_visualize_data(null);
        }

        clear() {
            this.stop();
            this.milliseconds = 0;
            this.recorded_chunks = [];
            this.duration_displayer(this.milliseconds / 1000);

            // clear data_blob
            this.data_blob = null;
        }

        get_data() {
            return this.data_blob;
        }
    }

    const build_control = function (dom, max_record_time = 60) {
        const recorder_button = document.createElement("div");
        recorder_button.classList.add("record-button");

        const visualizer_dom = document.createElement("div");
        visualizer_dom.classList.add("visualizer");

        const bevel_dom = document.createElement("div");
        bevel_dom.classList.add("bevel");
        bevel_dom.innerHTML = `<div class="${ui_toolkit_symbols_class} record" role="button">mic</div><div class="${ui_toolkit_symbols_class} stop" role="button">pause</div>`;

        recorder_button.appendChild(visualizer_dom);
        recorder_button.appendChild(bevel_dom);
        dom.appendChild(recorder_button);

        const record_bar = document.createElement("div");
        record_bar.classList.add("record-bar");

        const record_time = document.createElement("span");
        record_bar.appendChild(record_time);
        record_time.innerHTML = "00:00 / " + format_seconds(max_record_time);

        const reset_button = document.createElement("span");
        reset_button.classList.add("button", ui_toolkit_symbols_class);
        reset_button.role = "button";
        reset_button.setAttribute("aria-label", "Clear");
        reset_button.innerHTML = "delete";
        record_bar.appendChild(reset_button);

        const playback_button = document.createElement("span");
        playback_button.classList.add("button", ui_toolkit_symbols_class);
        playback_button.role = "button";
        playback_button.setAttribute("aria-label", "Play");
        playback_button.innerHTML = "play_arrow";
        record_bar.appendChild(playback_button);

        dom.appendChild(record_bar);

        const r = new Recorder_control(
            visualizer_dom,
            (duration) => {
                record_time.innerHTML = format_seconds(duration) + " / " + format_seconds(max_record_time);
            },
            stream,
            audio_mime_type,
            ios,
            get_audio_data,
            buffer_length,
            max_record_time
        );

        recorder_button.addEventListener("click", function () {
            if (r.is_recording) {
                r.stop();
            } else {
                r.start();
            }
            recorder_button.classList.toggle("toggled");
        });

        reset_button.addEventListener("click", function () {
            record_time.innerHTML = "00:00 / " + format_seconds(max_record_time);
            r.clear();
        });

        let playing_audio = null;
        playback_button.addEventListener("click", function () {
            if (playing_audio != null) {
                playing_audio.pause();
            }
            const data_blob = r.get_data();
            if (data_blob != null) {
                playing_audio = new Audio(URL.createObjectURL(data_blob));
                playing_audio.play();
            }
        });

        return r;
    };

    const initialize = async function () {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        let audio_ctx = new (window.AudioContext || window.webkitAudioContext)();

        const analyser = audio_ctx.createAnalyser();
        const source = audio_ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        // analyser.connect(audio_ctx.destination);

        analyser.fftSize = 32;
        analyser.smoothingTimeConstant = 0.2;
        buffer_length = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(buffer_length);

        get_audio_data = function () {
            analyser.getByteFrequencyData(dataArray);
            return dataArray;
        };

        const isSupported = MediaRecorder.isTypeSupported;
        if (isSupported("audio/mp4")) {
            const options = { mimeType: "audio/mp4" };
            audio_mime_type = "audio/mp4";
            ios = true;
        } else {
            const options = { mimeType: "audio/webm" };
            audio_mime_type = "audio/webm";
        }
    };

    return {
        init: initialize,
        build_control: build_control,
    };
})();
