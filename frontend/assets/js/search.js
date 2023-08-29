/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ChannelsDB;
(function (ChannelsDB) {
    var About = (function (_super) {
        __extends(About, _super);
        function About() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        About.prototype.render = function () {
            return React.createElement("div", { className: 'container' },
                React.createElement("h1", { className: 'text-center' }, "References"),
                React.createElement("div", { className: 'tab-pane' },
                    React.createElement("p", null, "If you find this resource usefull, please cite is as:"),
                    React.createElement("dl", { className: 'publications-list' },
                        React.createElement("dt", null, "ChannelsDB"),
                        React.createElement("dd", null,
                            React.createElement("p", null,
                                "Pravda,L., Sehnal,D., Svobodov\u00E1 Va\u0159ekov\u00E1,R., Navr\u00E1tilov\u00E1,V., Tou\u0161ek,D., Berka,K., Otyepka,M. and Ko\u010Da,J. \u00A0",
                                React.createElement("a", { href: 'https://dx.doi.org/10.1093/nar/gkx868', target: '_blank' }, "ChannelsDB: database of biomacromolecular tunnels and pores."),
                                "Nucleic Acids Res., 10.1093/nar/gkx868.")))),
                React.createElement("div", { className: 'tab-pane' },
                    React.createElement("p", null, "Data annotations are taken from scientific literature, which is properly linked with a given PDB entry. Other than that the ChannelsDB uses the following services: "),
                    React.createElement("dl", { className: 'publications-list' },
                        React.createElement("dt", null, "MOLE"),
                        React.createElement("dd", null,
                            React.createElement("p", null,
                                "Sehnal,D., Svobodov\u00E1 Va\u0159ekov\u00E1,R., Berka,K., Pravda,L., Navr\u00E1tilov\u00E1,V., Ban\u00E1\u0161,P., Ionescu,C.-M., Otyepka,M. and Ko\u010Da,J. (2013) \u00A0",
                                React.createElement("a", { href: 'https://dx.doi.org/10.1186/1758-2946-5-39', target: '_blank' }, "MOLE 2.0: advanced approach for analysis of biomacromolecular channels"),
                                ". J. Cheminform., 5, 39.")),
                        React.createElement("dt", null, "CAVER"),
                        React.createElement("dd", null,
                            React.createElement("p", null,
                                "Chovancova E, Pavelka A, Benes P, Strnad O, Brezovsky J, Kozlikova B, Gora A, Sustr V, Klvana M, Medek P, Biedermannova L, Sochor J, Damborsky J. \u00A0",
                                React.createElement("a", { href: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3475669/", target: "_blank" }, "CAVER 3.0: a tool for the analysis of transport pathways in dynamic protein structures"),
                                ". PLoS Comput Biol. 2012;8(10):e1002708. doi: 10.1371/journal.pcbi.1002708.")),
                        React.createElement("dt", null, "LiteMol suite"),
                        React.createElement("dd", null,
                            React.createElement("p", null,
                                "Sehnal,D., Deshpande,M., Va\u0159ekov\u00E1,R.S., Mir,S., Berka,K., Midlik,A., Pravda,L., Velankar,S. and Ko\u010Da,J. (2017) \u00A0",
                                React.createElement("a", { href: 'https://dx.doi.org/10.1038/nmeth.4499' }, "LiteMol suite: interactive web-based visualization of large-scale macromolecular structure data"),
                                ". Nat. Methods, 14, 1121\u20131122.")),
                        React.createElement("dt", null, "UniProt API"),
                        React.createElement("dd", null,
                            React.createElement("p", null,
                                "Nightingale,A., Antunes,R., Alpi,E., Bursteinas,B., Gonzales,L., Liu,W., Luo,J., Qi,G., Turner,E. and Martin,M. (2017) \u00A0",
                                React.createElement("a", { href: 'https://dx.doi.org/10.1093/nar/gkx237', target: '_blank' }, "The Proteins API: accessing key integrated protein and genome information"),
                                ". Nucleic Acids Res., 45, W539\u2013W544.")),
                        React.createElement("dt", null, "Protein Data Bank in Europe"),
                        React.createElement("dd", null,
                            React.createElement("p", null,
                                "Velankar,S., van Ginkel,G., Alhroub,Y., Battle,G.M., Berrisford,J.M., Conroy,M.J., Dana,J.M., Gore,S.P., Gutmanas,A., Haslam,P., et al. (2016) \u00A0",
                                React.createElement("a", { href: 'https://dx.doi.org/10.1093/nar/gkv1047', target: '_blank' }, "PDBe: improved accessibility of macromolecular structure data from PDB and EMDB"),
                                ". Nucleic Acids Res., 44, D385\u2013D395.")),
                        React.createElement("dt", null, "SIFTS"),
                        React.createElement("dd", null,
                            React.createElement("p", null,
                                "Velankar,S., Dana,J.M., Jacobsen,J., van Ginkel,G., Gane,P.J., Luo,J., Oldfield,T.J., O\u2019Donovan,C., Martin,M.-J. and Kleywegt,G.J. (2013) \u00A0",
                                React.createElement("a", { href: 'https://dx.doi.org/10.1093/nar/gks1258', target: '_blank' }, "SIFTS: Structure Integration with Function, Taxonomy and Sequences resource"),
                                ". Nucleic Acids Res., 41, D483\u2013D489.")))));
        };
        return About;
    }(React.Component));
    ChannelsDB.About = About;
})(ChannelsDB || (ChannelsDB = {}));
/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var ChannelsDB;
(function (ChannelsDB) {
    var SUBMIT_URL = 'https://webchem.ncbr.muni.cz/API/ChannelsDB/UploadAnnotations/';
    var EditableRow = (function (_super) {
        __extends(EditableRow, _super);
        function EditableRow() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.state = { value: Object.create(null) };
            return _this;
        }
        EditableRow.prototype.add = function () {
            var spec = this.props.spec;
            var cols = Object.keys(spec);
            var curr = this.state.value;
            var canAdd = Object.keys(curr).every(function (k) { return typeof curr[k] === 'string' && curr[k].trim().length > 0; }) && Object.keys(curr).length === cols.length;
            if (!canAdd)
                return;
            this.props.add(__assign({}, this.state.value));
            this.setState({ value: Object.create(null) });
            if (this.first)
                this.first.focus();
        };
        EditableRow.prototype.update = function (e) {
            this.setState({ value: __assign({}, this.state.value, (_a = {}, _a[e.name] = e.value, _a)) });
            var _a;
        };
        EditableRow.prototype.render = function () {
            var _this = this;
            var spec = this.props.spec;
            var cols = Object.keys(spec);
            var curr = this.state.value;
            var canAdd = Object.keys(curr).every(function (k) { return typeof curr[k] === 'string' && curr[k].trim().length > 0; }) && Object.keys(curr).length === cols.length;
            return React.createElement("tr", null,
                cols.map(function (c) { return React.createElement("td", { key: c, style: { width: spec[c].width }, className: 'form-group' },
                    React.createElement("input", { ref: function (r) { return c === cols[0] ? _this.first = r : void 0; }, name: c, className: 'form-control', type: 'text', placeholder: spec[c].placeholder, onChange: function (e) { return _this.update(e.target); }, value: curr[c] || '', onKeyPress: function (e) { return e.key === 'Enter' ? _this.add() : void 0; } })); }),
                React.createElement("td", { key: 'actions' },
                    React.createElement("button", { className: 'btn btn-success', disabled: !canAdd, onClick: function () { return _this.add(); } },
                        React.createElement("span", { className: 'glyphicon glyphicon-plus', "aria-hidden": 'true' }))));
        };
        return EditableRow;
    }(React.Component));
    var EditableTable = (function (_super) {
        __extends(EditableTable, _super);
        function EditableTable() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.state = { entries: [] };
            _this.id = 0;
            return _this;
        }
        EditableTable.prototype.add = function (e) {
            this.props.entries.push(e);
            e._id = this.id++;
            this.setState({ entries: this.props.entries.slice() });
            this.props.updated();
        };
        EditableTable.prototype.remove = function (e) {
            var entries = this.props.entries;
            var idx = entries.indexOf(e);
            if (idx < 0)
                return;
            for (var i = idx; i < entries.length - 1; i++) {
                entries[i] = entries[i + 1];
            }
            entries.pop();
            this.setState({ entries: this.props.entries.slice() });
            this.props.updated();
        };
        EditableTable.prototype.componentWillReceiveProps = function (nextProps) {
            this.setState({ entries: nextProps.entries });
        };
        EditableTable.prototype.componentDidMount = function () {
            this.setState({ entries: this.props.entries });
        };
        EditableTable.prototype.render = function () {
            var _this = this;
            var spec = this.props.spec;
            var cols = Object.keys(spec);
            return React.createElement("table", { className: 'table table-striped table-bordered' },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        cols.map(function (c) { return React.createElement("th", { key: c, style: { width: spec[c].width } }, spec[c].header); }),
                        React.createElement("th", { style: { width: '50px' } }))),
                React.createElement("tbody", null,
                    React.createElement(EditableRow, __assign({}, this.props, { add: function (e) { return _this.add(e); } })),
                    this.state.entries.map(function (e) { return React.createElement("tr", { key: e._id },
                        cols.map(function (c) { return React.createElement("td", { key: c, style: { width: spec[c].width, verticalAlign: 'middle', padding: '0 15px' } }, e[c]); }),
                        React.createElement("td", { key: 'actions' },
                            React.createElement("button", { className: 'btn btn-danger', onClick: function () { return _this.remove(e); } },
                                React.createElement("span", { className: 'glyphicon glyphicon-remove', "aria-hidden": 'true' })))); })));
        };
        return EditableTable;
    }(React.Component));
    function FormState() {
        return { pdbId: '', email: '', channels: [], residues: [], files: [] };
    }
    function formatEntries(xs) {
        var ret = [];
        for (var _i = 0, xs_1 = xs; _i < xs_1.length; _i++) {
            var x = xs_1[_i];
            var e = __assign({}, x);
            delete e._id;
            ret.push(e);
        }
        return JSON.stringify(ret);
    }
    function makeFormData(data) {
        var fd = new FormData();
        fd.append('pdbId', data.pdbId);
        fd.append('email', data.email || '');
        fd.append('channels', formatEntries(data.channels));
        fd.append('residues', formatEntries(data.residues));
        var index = 0;
        fd.append('fileCount', '' + data.files.length);
        for (var _i = 0, _a = data.files; _i < _a.length; _i++) {
            var file = _a[_i];
            fd.append("file[" + index++ + "]", file);
        }
        return fd;
    }
    function uploadAjaxFormData(formData, actionUrl, options) {
        options = options || {};
        var onProgress = options['onProgress'] || function () { };
        function uploadFile() {
            var xhr = new XMLHttpRequest();
            xhr.upload.addEventListener('progress', uploadProgress, false);
            xhr.addEventListener('load', uploadComplete, false);
            xhr.addEventListener('error', uploadFailed, false);
            xhr.open('POST', actionUrl);
            xhr.send(formData);
            return xhr;
        }
        function uploadProgress(evt) {
            if (evt.lengthComputable) {
                onProgress(evt.loaded, evt.total);
            }
            else {
                onProgress();
            }
        }
        function uploadComplete(evt) {
            var response = JSON.parse(evt.target.responseText);
            if (options['onComplete'] !== undefined)
                options.onComplete(response);
        }
        function uploadFailed(evt) {
            if (options['onFailed'] !== undefined)
                options.onFailed();
        }
        return uploadFile();
    }
    function submit(data) {
        var subj = new Rx.Subject();
        uploadAjaxFormData(makeFormData(data), SUBMIT_URL, {
            onComplete: function (response) {
                if (response.Status && response.Status === 'OK') {
                    subj.onCompleted();
                }
                else {
                    subj.onError(response.Msg || 'Unknown error.');
                }
            },
            onProgress: function (current, total) {
                if (current !== undefined && total !== undefined) {
                    var percentComplete = Math.round(current * 1000 / total) / 10;
                    subj.onNext(percentComplete + "%");
                }
                else {
                    subj.onNext("");
                }
            },
            onFailed: function () {
                subj.onError('Unknown error.');
            },
        });
        return subj;
    }
    var Contribute = (function (_super) {
        __extends(Contribute, _super);
        function Contribute() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.state = { state: 'editing', formState: FormState(), submitProgress: '' };
            _this.errorMsg = '';
            _this.submitProgress = void 0;
            _this.channelsSpec = {
                id: { header: 'Channel Id', width: '170px', placeholder: 'Identificaton (eg. 1)' },
                name: { header: 'Name', width: '200px', placeholder: 'Suggested name' },
                description: { header: 'Description', width: 'auto', placeholder: 'Detailed description of channel\'s function' },
                reference: { header: 'Reference', width: '170px', placeholder: 'DOI or Pubmed ID.' },
            };
            _this.residuesSpec = {
                id: { header: 'Residue Id', width: '200px', placeholder: 'ALA 10 A' },
                text: { header: 'Annotation', width: 'auto', placeholder: 'Detailed description of residue\'s function.' },
                reference: { header: 'Reference', width: '300px', placeholder: 'DOI or Pubmed ID.' },
            };
            _this._submit = void 0;
            return _this;
        }
        Contribute.prototype.updatedAnnotations = function () {
            var state = __assign({}, this.state.formState);
            this.setState({ formState: state });
        };
        Contribute.prototype.update = function (input) {
            var state = __assign({}, this.state.formState, (_a = {}, _a[input.name] = input.value, _a));
            this.setState({ formState: state });
            var _a;
        };
        Contribute.prototype.setFiles = function (input) {
            var files = [];
            var len = (input.files && input.files.length) || 0;
            for (var i = 0; i < len; i++)
                files.push(input.files[i]);
            var state = __assign({}, this.state.formState, { files: files });
            this.setState({ formState: state });
        };
        Contribute.prototype.getIssues = function () {
            var fs = this.state.formState;
            var issues = [];
            if (fs.pdbId.trim().length !== 4)
                issues.push('PDB id must be 4 characters long.');
            if (!fs.residues.length && !fs.channels.length)
                issues.push('Enter at least one residue or channel annotation.');
            // if (!fs.files.length) issues.push('Add at least one file with computed channels.');
            return issues;
        };
        Contribute.prototype.submitStart = function () {
            var _this = this;
            this.setState({ state: 'submitting' });
            if (this._submit) {
                this._submit.dispose();
                this._submit = void 0;
            }
            this.submitProgress = submit(this.state.formState);
            this._submit = this.submitProgress.subscribe(function (p) { return _this.setState({ submitProgress: p }); }, function (e) { return _this.submitDone(e); }, function () { return _this.submitDone(); });
        };
        Contribute.prototype.submitDone = function (err) {
            if (this._submit) {
                this._submit.dispose();
                this._submit = void 0;
            }
            if (err) {
                this.errorMsg = '' + err;
                this.setState({ state: 'error' });
            }
            else {
                this.setState({ state: 'thank-you', formState: FormState() });
            }
        };
        Contribute.prototype.thankYou = function () {
            var _this = this;
            return React.createElement("div", null,
                React.createElement("h2", { style: { textAlign: 'center' } }, "Thank you for submitting your data."),
                React.createElement("button", { className: 'btn btn-primary btn-block', onClick: function () { return _this.setState({ state: 'editing' }); } }, "Submit another..."));
        };
        Contribute.prototype.submitting = function () {
            return React.createElement("h3", null,
                "Your data is being submitted... ",
                this.state.submitProgress);
        };
        Contribute.prototype.error = function () {
            var _this = this;
            return React.createElement("div", null,
                React.createElement("h3", null, "Error submitting your data"),
                React.createElement("div", { style: { color: 'red' } }, this.errorMsg),
                React.createElement("button", { className: 'btn', onClick: function () { return _this.submitStart(); } }, "Try submit again"),
                React.createElement("button", { className: 'btn', onClick: function () { return _this.setState({ state: 'editing' }); } }, "Edit data"));
        };
        Contribute.prototype.edit = function () {
            var _this = this;
            var fs = this.state.formState;
            var issues = this.getIssues();
            return React.createElement("div", null,
                React.createElement("p", null,
                    "If you would like to contribute to the ChannelsDB or point out not yet annotated systems with known channels, please use the form below, alternativelly annotate channels online with ",
                    React.createElement("a", { href: 'https://mole.upol.cz' }, "MOLEonline")),
                React.createElement("div", { className: 'form-horizontal' },
                    React.createElement("div", null,
                        React.createElement("div", { className: 'form-group' },
                            React.createElement("label", { className: 'control-label col-sm-2', htmlFor: 'pdbId' }, "PDB identifier"),
                            React.createElement("div", { className: 'col-sm-10' },
                                React.createElement("input", { type: 'text', className: 'form-control', "data-tip": 'hi :)!', placeholder: '1tqn', name: 'pdbId', value: fs.pdbId, onChange: function (e) { return _this.update(e.target); } }))),
                        React.createElement("div", { className: 'form-group' },
                            React.createElement("label", { className: 'control-label col-sm-2', htmlFor: 'email' }, "E-mail"),
                            React.createElement("div", { className: 'col-sm-10' },
                                React.createElement("input", { type: 'text', className: 'form-control', name: 'email', placeholder: '(optional for further contact) jon.snow@uni.ac.uk', onChange: function (e) { return _this.update(e.target); }, value: fs.email }))),
                        React.createElement("h2", null, "Channel Annotations"),
                        React.createElement(EditableTable, { key: 'channels-annotations', entries: fs.channels, spec: this.channelsSpec, updated: function () { return _this.updatedAnnotations(); } }),
                        React.createElement("h2", null, "Residue Annotations"),
                        React.createElement(EditableTable, { key: 'residue-annotations', entries: fs.residues, spec: this.residuesSpec, updated: function () { return _this.updatedAnnotations(); } }),
                        React.createElement("hr", { className: 'featurette-divider', style: { margin: '20px 0' } }),
                        React.createElement("div", { className: 'input-group' },
                            React.createElement("label", { className: 'input-group-btn' },
                                React.createElement("span", { className: 'btn btn-default' },
                                    "Select channels\u2026 ",
                                    React.createElement("input", { type: 'file', style: { display: 'none' }, multiple: true, onChange: function (e) { return _this.setFiles(e.target); } }))),
                            React.createElement("input", { type: 'text', className: 'form-control', readOnly: true, value: fs.files.map(function (f) { return f.name; }).join(', ') })),
                        React.createElement("br", null)),
                    issues.length > 0
                        ? React.createElement("div", null,
                            React.createElement("ul", { style: { color: 'red' } }, issues.map(function (i) { return React.createElement("li", { key: i }, i); })))
                        : React.createElement("button", { className: 'btn btn-block btn-primary', onClick: function () { return _this.submitStart(); } }, "Submit")));
        };
        Contribute.prototype.render = function () {
            var _this = this;
            // const fs = this.state.formState;
            // const issues = this.getIssues();
            var ui;
            switch (this.state.state) {
                case 'editing':
                    ui = function () { return _this.edit(); };
                    break;
                case 'error':
                    ui = function () { return _this.error(); };
                    break;
                case 'thank-you':
                    ui = function () { return _this.thankYou(); };
                    break;
                case 'submitting':
                    ui = function () { return _this.submitting(); };
                    break;
            }
            return React.createElement("div", { style: { margin: '60px 0 0 20px' } },
                React.createElement("h1", { className: 'text-center' }, "Contribute"),
                ui());
        };
        return Contribute;
    }(React.Component));
    ChannelsDB.Contribute = Contribute;
})(ChannelsDB || (ChannelsDB = {}));
/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var ChannelsDB;
(function (ChannelsDB) {
    var Documentation = (function (_super) {
        __extends(Documentation, _super);
        function Documentation() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Documentation.prototype.render = function () {
            var justify = {
                textAlign: 'justify',
                textJustify: 'inter-word',
            };
            return React.createElement("div", { style: { margin: '60px 0 0 20px' } },
                React.createElement("h1", { className: 'text-center' }, "Documentation"),
                React.createElement("h2", null, "Table of content"),
                React.createElement("div", { className: 'list-group well-sm' },
                    React.createElement("a", { href: '#db-content', className: 'list-group-item' },
                        React.createElement("h4", { className: 'list-group-item-heading' }, "Database content"),
                        React.createElement("p", { className: 'list-group-item-text' }, "What you can find in the database?")),
                    React.createElement("a", { href: '#db-nomenclature', className: 'list-group-item' },
                        React.createElement("h4", { className: 'list-group-item-heading' }, "Channels nomenclature "),
                        React.createElement("p", { className: 'list-group-item-text' }, "Nomenclature used for channel naming.")),
                    React.createElement("a", { href: '#db-mole', className: 'list-group-item' },
                        React.createElement("h4", { className: 'list-group-item-heading' }, "MOLE settings"),
                        React.createElement("p", { className: 'list-group-item-text' }, "Settings used for channel extraction.")),
                    React.createElement("a", { href: '#db-caver', className: 'list-group-item' },
                        React.createElement("h4", { className: 'list-group-item-heading' }, "CAVER settings"),
                        React.createElement("p", { className: 'list-group-item-text' }, "Settings used for channel extraction.")),
                    React.createElement("a", { href: '#db-cofactors', className: 'list-group-item' },
                        React.createElement("h4", { className: 'list-group-item-heading' }, "Cofactors"),
                        React.createElement("p", { className: 'list-group-item-text' }, "List of cofactors used for channel calculation.")),
                    React.createElement("a", { href: '#db-results', className: 'list-group-item' },
                        React.createElement("h4", { className: 'list-group-item-heading' }, "Results view"),
                        React.createElement("p", { className: 'list-group-item-text' }, "How to read the results page?")),
                    React.createElement("a", { href: '#db-api', className: 'list-group-item' },
                        React.createElement("h4", { className: 'list-group-item-heading' }, "API"),
                        React.createElement("p", { className: 'list-group-item-text' }, "How to access content of the database programatically."))),
                React.createElement("hr", { className: 'featurette-divider', style: { margin: '50px 0' } }),
                React.createElement('a', { 'name': 'db-content' }),
                React.createElement("div", { className: 'row' },
                    React.createElement("div", { className: 'col-md-8' },
                        React.createElement("h2", { className: 'featurette-heading' }, "Database content"),
                        React.createElement("p", null,
                            React.createElement("b", null, "The entire database is composed out of the following content:"),
                            React.createElement("ul", null,
                                React.createElement("li", null, "Manually curated channel annotations from literature extracted entries"),
                                React.createElement("li", null,
                                    "Ligand-accessible tunnels to the catalytic sites annotated in the ",
                                    React.createElement("a", { target: '_blank', href: 'https://www.ebi.ac.uk/thornton-srv/m-csa/' }, "Catalytic Site Atlas")),
                                React.createElement("li", null,
                                    "Product/substrate tunnels leading towards the well-known enzyme cofactors such as ",
                                    React.createElement("abbr", { className: 'abbr initialism', title: 'HEME (Protoporhpyrin IX containing Fe)' }, "HEM"),
                                    " or ",
                                    React.createElement("abbr", { className: 'abbr initialism', title: 'Flavin-adenine dinucleotide' }, "FAD")),
                                React.createElement("li", null,
                                    "Pores in transmembrane proteins enabling flow of ions and small molecules across the lipid bilayer for proteins deposited in the ",
                                    React.createElement("a", { target: '_blank', href: 'https://opm.phar.umich.edu/' }, "OPM"),
                                    " database")),
                            "All the channels have been extracted from biological assemblies as identified by the Protein Data Bank in Europe.")),
                    React.createElement("div", { className: 'col-md-4' },
                        React.createElement("img", { className: 'featurette-image img-responsive center-block', src: 'assets/img/pretty_channel.png', width: '500', height: '500', alt: 'Channel details' }))),
                React.createElement("hr", { className: 'featurette-divider', style: { margin: '50px 0' } }),
                React.createElement('a', { 'name': 'db-nomenclature' }),
                React.createElement("div", { className: 'row' },
                    React.createElement("h2", { className: 'featurette-heading' }, "Channel nomenclature"),
                    React.createElement("p", null,
                        "Unless the channel has been given a particular name in literature, which is the case e.g. for a group of ",
                        React.createElement("a", { href: 'https://dx.doi.org/10.1016/j.bbagen.2006.07.005', target: '_blank' }, "cytochrome P450s"),
                        ", names are given to accordingly the following controlled vocabulary:"),
                    React.createElement("div", { className: 'row table-responsive col-md-8 col-md-offset-2' },
                        React.createElement("table", { className: 'table table-condensed active' },
                            React.createElement("thead", null,
                                React.createElement("tr", null,
                                    React.createElement("th", null, "Name"),
                                    React.createElement("th", null, "Description"))),
                            React.createElement("tbody", null,
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Channel"),
                                    React.createElement("td", null, "Generic term for any ligand transporting pathway")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Tunnel"),
                                    React.createElement("td", null, "Generic term for a ligand transporting pathway towards the enzyme active site")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Pore"),
                                    React.createElement("td", null, "Generic term for a channel spanning across a biomacromolecule")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Solvent tunnel"),
                                    React.createElement("td", null, "Tunnel transporting water molecules, which are consumed/egressed during a chemical reaction")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Substrate tunnel"),
                                    React.createElement("td", null, "Tunnel transporting various chemical species consumed in a chemical reaction")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Substrate/Product tunnel"),
                                    React.createElement("td", null, "Single tunnel facilitating transport of all chemical species to/from the catalytic site.")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Product tunnel"),
                                    React.createElement("td", null, "Tunnel transporting chemical species that are an outcome of chemical reaction")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Water channel"),
                                    React.createElement("td", null, "Tunnel transporting water molecules; mainly found in aquaporins.")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Ion channel"),
                                    React.createElement("td", null, "Pore providing a pathway for ion and other charged chemical species to pass through lipid bilayer")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Hydrophobic channel"),
                                    React.createElement("td", null, "Pore providing a pathway for apolar chemical species to pass through lipid bilayer")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Peptide channel"),
                                    React.createElement("td", null, "Channel enabling a passage of polypeptides")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Nucleotide channel"),
                                    React.createElement("td", null, "Channel enabling a passage of nucleotides")))))),
                React.createElement("hr", { className: 'featurette-divider', style: { margin: '50px 0' } }),
                React.createElement('a', { 'name': 'db-mole' }),
                React.createElement("div", { className: 'row' },
                    React.createElement("h2", { className: 'featurette-heading' }, "MOLE settings"),
                    React.createElement("p", { style: justify }, "Throughout the ChannelsDB the following settings of the MOLE algorithm have been used for individual types of channels."),
                    React.createElement("h4", { className: 'featurette-heading' }, "Reviewed channels"),
                    React.createElement("p", { style: justify }, "Each calculation has been independently adjusted, in order to extract deemed channels."),
                    React.createElement("div", { className: 'row table-responsive col-md-4 col-md-offset-1' },
                        React.createElement("h2", { className: 'featurette-heading' }, "CSA tunnels"),
                        React.createElement("table", { className: 'table table-condensed active' },
                            React.createElement("thead", null,
                                React.createElement("tr", null,
                                    React.createElement("th", null, "Parameter"),
                                    React.createElement("th", null, "Value"))),
                            React.createElement("tbody", null,
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "ProbeRadius")),
                                    React.createElement("td", null, "5.0")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "InteriorThreshold")),
                                    React.createElement("td", null, "1.1")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "MinTunnelLength")),
                                    React.createElement("td", null, "15.0")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "BottleneckRadius")),
                                    React.createElement("td", null, "1.25")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "BottleneckTolerance")),
                                    React.createElement("td", null, "3.0")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "MaxTunnelSimilarity")),
                                    React.createElement("td", null, "0.7")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "NonActiveParts")),
                                    React.createElement("td", { "data-toggle": 'tooltip', "data-placement": 'bottom', title: 'HetResidues().Filter(lambda m: m.IsNotConnectedTo(AminoAcids()))' }, "Query"))))),
                    React.createElement("div", { className: 'row table-responsive col-md-4 col-md-push-2' },
                        React.createElement("h2", { className: 'featurette-heading' }, "Cofactor tunnels"),
                        React.createElement("table", { className: 'table table-condensed active' },
                            React.createElement("thead", null,
                                React.createElement("tr", null,
                                    React.createElement("th", null, "Parameter"),
                                    React.createElement("th", null, "Value"))),
                            React.createElement("tbody", null,
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "ProbeRadius")),
                                    React.createElement("td", null, "5.0")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "InteriorThreshold")),
                                    React.createElement("td", null, "1.4")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "IgnoreHetResidues")),
                                    React.createElement("td", null, "True")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "MinTunnelLength")),
                                    React.createElement("td", null, "15.0")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "BottleneckRadius")),
                                    React.createElement("td", null, "1.25")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "BottleneckTolerance")),
                                    React.createElement("td", null, "1.0")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "MaxTunnelSimilarity")),
                                    React.createElement("td", null, "0.7")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "NonActiveParts")),
                                    React.createElement("td", { "data-toggle": 'tooltip', "data-placement": 'bottom', title: 'Various queries e.g. Atoms("Fe").Inside(Residues("HEM", "HEC", "HEA"))' }, "Query"))))),
                    React.createElement("div", { className: 'row table-responsive col-md-4 col-md-push-2' },
                        React.createElement("h2", { className: 'featurette-heading' }, "Cognate tunnels"),
                        React.createElement("table", { className: 'table table-condensed active' },
                            React.createElement("thead", null,
                                React.createElement("tr", null,
                                    React.createElement("th", null, "Parameter"),
                                    React.createElement("th", null, "Value"))),
                            React.createElement("tbody", null,
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "ProbeRadius")),
                                    React.createElement("td", null, "5.0")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "InteriorThreshold")),
                                    React.createElement("td", null, "1.4")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "IgnoreHetResidues")),
                                    React.createElement("td", null, "True")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "MinTunnelLength")),
                                    React.createElement("td", null, "15.0")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "BottleneckRadius")),
                                    React.createElement("td", null, "1.25")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "BottleneckTolerance")),
                                    React.createElement("td", null, "1.0")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "MaxTunnelSimilarity")),
                                    React.createElement("td", null, "0.7")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "NonActiveParts")),
                                    React.createElement("td", { "data-toggle": 'tooltip', "data-placement": 'bottom', title: 'Various queries e.g. Atoms("Fe").Inside(Residues("HEM", "HEC", "HEA"))' }, "Query"))))),
                    React.createElement("div", { className: 'row table-responsive col-md-4 col-md-push-2' },
                        React.createElement("h2", { className: 'featurette-heading' }, "AlphaFill tunnels"),
                        React.createElement("table", { className: 'table table-condensed active' },
                            React.createElement("thead", null,
                                React.createElement("tr", null,
                                    React.createElement("th", null, "Parameter"),
                                    React.createElement("th", null, "Value"))),
                            React.createElement("tbody", null,
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "ProbeRadius")),
                                    React.createElement("td", null, "5.0")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "InteriorThreshold")),
                                    React.createElement("td", null, "1.4")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "IgnoreHetResidues")),
                                    React.createElement("td", null, "True")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "MinTunnelLength")),
                                    React.createElement("td", null, "15.0")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "BottleneckRadius")),
                                    React.createElement("td", null, "1.25")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "BottleneckTolerance")),
                                    React.createElement("td", null, "1.0")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "MaxTunnelSimilarity")),
                                    React.createElement("td", null, "0.7")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "NonActiveParts")),
                                    React.createElement("td", { "data-toggle": 'tooltip', "data-placement": 'bottom', title: 'Various queries e.g. Atoms("Fe").Inside(Residues("HEM", "HEC", "HEA"))' }, "Query")))))),
                React.createElement("hr", { className: 'featurette-divider', style: { margin: '50px 0' } }),
                React.createElement('a', { 'name': 'db-caver' }),
                React.createElement("div", { className: 'row' },
                    React.createElement("h2", { className: 'featurette-heading' }, "CAVER settings"),
                    React.createElement("p", { style: justify }, "All tunnels from CAVER in ChannelsDB were calculated using the following settings."),
                    React.createElement("div", { className: 'row table-responsive col-md-4 col-md-offset-1' },
                        React.createElement("h2", { className: 'featurette-heading' }, "CAVER tunnels"),
                        React.createElement("table", { className: 'table table-condensed active' },
                            React.createElement("thead", null,
                                React.createElement("tr", null,
                                    React.createElement("th", null, "Parameter"),
                                    React.createElement("th", null, "Value"))),
                            React.createElement("tbody", null,
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "ProbeRadius")),
                                    React.createElement("td", null, "0.9")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "Shell radius")),
                                    React.createElement("td", null, "3")),
                                React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("i", null, "Shell depth")),
                                    React.createElement("td", null, "4")))))),
                React.createElement("hr", { className: 'featurette-divider', style: { margin: '50px 0' } }),
                React.createElement('a', { 'name': 'db-cofactors' }),
                React.createElement("div", { className: 'row' },
                    React.createElement("h2", { className: 'featurette-heading' }, "Cofactors list"),
                    React.createElement("p", null, "The well-known biologically important cofactors, which are often buried within a protein structure, have been selected for a channel extraction."),
                    React.createElement("div", { className: 'row table-responsive col-md-8 col-md-offset-2' },
                        React.createElement("table", { className: 'table table-condensed active' },
                            React.createElement("thead", null,
                                React.createElement("tr", null,
                                    React.createElement("th", null, "Group"),
                                    React.createElement("th", null, "Origin"),
                                    React.createElement("th", null, "Ligand list"))),
                            React.createElement("tbody", null,
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Hems"),
                                    React.createElement("td", null,
                                        "Fe (",
                                        React.createElement("i", null, "type_symbol"),
                                        ")"),
                                    React.createElement("td", null,
                                        React.createElement("i", null, "HEA, HEM, HEC"))),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Flavins"),
                                    React.createElement("td", null,
                                        "N5 (",
                                        React.createElement("i", null, "auth_atom_id"),
                                        ")"),
                                    React.createElement("td", null,
                                        React.createElement("i", null, "FAD, FMN"))),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Nicotinadenins"),
                                    React.createElement("td", null,
                                        "N1N (",
                                        React.createElement("i", null, "auth_atom_id"),
                                        ")"),
                                    React.createElement("td", null,
                                        React.createElement("i", null, "NAD, NAP, NDP, NAI"))),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Nucleotides"),
                                    React.createElement("td", null,
                                        "PA atom (",
                                        React.createElement("i", null, "auth_atom_id"),
                                        ")"),
                                    React.createElement("td", null,
                                        React.createElement("i", null, "ATP, CTP, UTP, GTP, TTP, ADP, CDP, UDP, GDP, TDP, AMP, CMP, ANP"))),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Vitamin B2"),
                                    React.createElement("td", null,
                                        "N5 (",
                                        React.createElement("i", null, "auth_atom_id"),
                                        ")"),
                                    React.createElement("td", null,
                                        React.createElement("i", null, "RBF"))),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Vitamin B6"),
                                    React.createElement("td", null,
                                        "C4A (",
                                        React.createElement("i", null, "auth_atom_id"),
                                        ")"),
                                    React.createElement("td", null,
                                        React.createElement("i", null, "PLP"))),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Vitamin B12"),
                                    React.createElement("td", null,
                                        "CO (",
                                        React.createElement("i", null, "auth_atom_id"),
                                        ")"),
                                    React.createElement("td", null,
                                        React.createElement("i", null, "B12"))),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Biotin"),
                                    React.createElement("td", null,
                                        "C3 (",
                                        React.createElement("i", null, "auth_atom_id"),
                                        ")"),
                                    React.createElement("td", null,
                                        React.createElement("i", null, "BTN"))),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Coenzym"),
                                    React.createElement("td", null,
                                        "S1P (",
                                        React.createElement("i", null, "auth_atom_id"),
                                        ")"),
                                    React.createElement("td", null,
                                        React.createElement("i", null, "COA, ACO"))),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Glutathione"),
                                    React.createElement("td", null,
                                        "SG2 (",
                                        React.createElement("i", null, "auth_atom_id"),
                                        ")"),
                                    React.createElement("td", null,
                                        React.createElement("i", null, "GSH, GDS"))))))),
                React.createElement("hr", { className: 'featurette-divider', style: { margin: '50px 0' } }),
                React.createElement('a', { 'name': 'db-results' }),
                React.createElement("div", { className: 'row featurette' },
                    React.createElement("h2", { className: 'featurette-heading' }, "Results interpretation"),
                    React.createElement("div", { className: 'col-md-5' },
                        React.createElement("p", { style: justify }, "The results page is separated into 5 different sections. All of them are interactive, so play around!"),
                        React.createElement("ol", null,
                            React.createElement("li", null,
                                "The main part contains molecule visualization using LiteMol. The documentation how to change visual representation of the results is available in the ",
                                React.createElement("a", { href: 'https://webchem.ncbr.muni.cz/Wiki/LiteMol:UserManual', target: '_blank' }, "LiteMol documentation"),
                                "."),
                            React.createElement("li", null, "Right next to the visualization panel is a list of all channels identified for the particular PDB entry displayed. All channels are grouped to respective categories."),
                            React.createElement("li", null, "Directly below the visualization pane you can find an interactive visualization of a channel profile. All the physicochemical properties are mapped on the channel profile. User can select deemed type of property to visualize, change the radius being measured to the closest atom or to the backbone. On the top of that to a publication quality image is available for export as well."),
                            React.createElement("li", null, "Next to the 2D channel visualization is a list with details for individual regions of a channel (so called layers). Additional level of information is provided as a residue level annotations with the respective reference."),
                            React.createElement("li", null, " Protein annotations from the UniProt resource."))),
                    React.createElement("div", { className: 'col-md-7' },
                        React.createElement("img", { className: 'featurette-image img-responsive center-block', src: 'assets/img/web-fig1.png', width: '500', height: '500', alt: 'Result window detail' }))),
                React.createElement("div", { style: { margin: '50px 0' }, className: 'row featurette col-md-12' },
                    React.createElement("img", { className: 'featurette-image img-responsive center-block', src: 'assets/img/web-fig2.png', width: '800', alt: '2D detailed channel view' })),
                React.createElement('a', { 'name': 'db-api' }),
                React.createElement("div", { className: 'channelsdb-api-docs' },
                    React.createElement("h2", { className: 'featurette-heading' }, "API "),
                    React.createElement("p", null,
                        " The entire database is powered by the API with an interactive ",
                        React.createElement("a", { href: "/api" }, "documentation"),
                        " available. Therefore, all the channel-related information can be programmatically retrieved and used for further processing. The returned content is ",
                        React.createElement("i", null, "application/json"),
                        " object and all the properties are self-explanatory. Should you have further questions or comments, do not hesitate to ",
                        React.createElement("a", { href: 'mailto:webchemistryhelp@gmail.com?subject=ChannelsDB2 - API' }, "contact us."))),
                React.createElement(ChannelsDB.ScrollButton, { scrollStepInPx: '50', delayInMs: '10' }));
        };
        return Documentation;
    }(React.Component));
    ChannelsDB.Documentation = Documentation;
})(ChannelsDB || (ChannelsDB = {}));
var ChannelsDB;
(function (ChannelsDB) {
    var GDPR = (function (_super) {
        __extends(GDPR, _super);
        function GDPR() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        GDPR.prototype.render = function () {
            var justify = {
                textAlign: 'justify',
                textJustify: 'inter-word',
            };
            return React.createElement("div", { style: { margin: '60px 0 0 20px' } },
                React.createElement("h1", null, "Terms of Use"),
                React.createElement("ol", null,
                    React.createElement("li", null, "We promote open science through its mission to provide freely available online services, database and software relating to data contributed from life science experiments to the largest possible community. Where we present scientific data generated by others we impose no additional restriction on the use of the contributed data than those provided by the data owner."),
                    React.createElement("li", null, "Attribution is expected (e.g. in publications, services or products) for any of our online services, databases or software in accordance with good scientific practice. The expected attribution is indicated on the About web page."),
                    React.createElement("li", null, "Any feedback provided to us on our online services will be treated as non-confidential unless the individual or organisation providing the feedback states otherwise."),
                    React.createElement("li", null, "We are not liable to you or third parties claiming through you, for any loss or damage."),
                    React.createElement("li", null, "We do not store personal data of any kind. We may make information about the total volume of usage of particular software or data available to the public and third party organisations who supply the software or databases without details of any individual\u2019s use."),
                    React.createElement("li", null, "While we will retain our commitment to OpenScience, we reserve the right to update these Terms of Use at any time. When alterations are inevitable, we will attempt to give reasonable notice of any changes by placing a notice on our website, but you may wish to check each time you use the website. The date of the most recent revision will appear on this, the \u2018Webchem Terms of Use\u2019 page. If you do not agree to these changes, please do not continue to use our online services. We will also make available an archived copy of the previous Terms of Use for comparison."),
                    React.createElement("li", null, "Any questions or comments concerning these Terms of Use can be addressed to: The Webchem Administrator, CEITEC, Masaryk University, Kamenice 753/5, 625 00 Brno, CZ.")),
                React.createElement("hr", null),
                React.createElement("h1", null, "General Data Protection Regulation (GDPR)"),
                React.createElement("p", null, "Dear visitors, with respect to the \u201CRegulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, and repealing Directive 95/46/EC (General Data Protection Regulation)\u201D hereinafter GDPR  we would like to inform you how your personal data are processed and secured."),
                React.createElement("p", null, "The legal base for data processing of the e-mail address you provided on our web pages is Article 6(1)(a) of the GDPR. We understand that we have received a legal consent to process your email address, in order for the notification or answer to your query is send back to you from our web pages."),
                React.createElement("p", null, "The data is recorded in order to enable us to send you the notification/answer to your question. The data are deleted once they are no longer necessary to achieve the purpose for which they were recorded. You are rightful to ask to delete this data item by sending a request to the e-mail address  webchemistryhelp@gmail.com."),
                React.createElement("p", null, "Data processing of your personal information is carried out by us. ICT systems being used is well secured. Provided we are processing your personal data acquired by a different means, but online (e.g. contract conclusion), all you personal data are processed with accordance to GDPR. None of your personal data are accessible by any third party subjects unless otherwise or lawfully specified."),
                React.createElement("p", null, "Your personal data are not shared outside the European Economic Area (EEA), therefore GDPR is applicable all the time."),
                React.createElement("p", null, "Our website uses cookies. Cookies are text files that are stored in or by the Internet browser on the user\u2019s computer system. If a user accesses a website, a cookie can be stored on the user\u2019s operating system. This cookie contains a characteristic sequence of characters that allow the browser to be identified when accessing the website again.We use cookies to make our website more user-friendly. Cookies cannot be used for identifying visitors or abuse of login data. Most of the web browsers accepts cookies unless stated otherwise. By using these web pages you agree on storing cookies in your computer. The use of cookies can be restricted or canceled in your web browser settings."),
                React.createElement("p", null, "Our web pages also use Google Analytics, which are solely used for statistical purposes. Remarketing and advertising services are deactivated by the administrator."),
                React.createElement("p", null, "Thank you for understanding, our main goal is to help you to carry out your research in accordance with the personal data protection regulation."),
                React.createElement("hr", { style: { marginBottom: '4px' } }));
        };
        return GDPR;
    }(React.Component));
    ChannelsDB.GDPR = GDPR;
})(ChannelsDB || (ChannelsDB = {}));
/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var ChannelsDB;
(function (ChannelsDB) {
    function renderUI(target, kind) {
        switch (kind) {
            case 'Search':
                ReactDOM.render(React.createElement(SearchMain, { state: ChannelsDB.initState() }), target);
                break;
            case 'Methods':
                ReactDOM.render(React.createElement(MethodsMain, null), target);
                break;
            case 'Documentation':
                ReactDOM.render(React.createElement(DocumentationMain, null), target);
                break;
            case 'Contribute':
                ReactDOM.render(React.createElement(ContributeMain, null), target);
                break;
            case 'About':
                ReactDOM.render(React.createElement(AboutMain, null), target);
                break;
            case 'GDPR':
                ReactDOM.render(React.createElement(GDPRMain, null), target);
                break;
        }
    }
    ChannelsDB.renderUI = renderUI;
    var SearchMain = (function (_super) {
        __extends(SearchMain, _super);
        function SearchMain() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SearchMain.prototype.render = function () {
            return React.createElement("div", { className: 'container' },
                React.createElement(ChannelsDB.Menu, null),
                React.createElement("div", { className: 'container-fluid', style: { padding: '0 15px ' } },
                    React.createElement(SearchView, __assign({}, this.props))),
                React.createElement(Footer, null));
        };
        return SearchMain;
    }(React.Component));
    var MethodsMain = (function (_super) {
        __extends(MethodsMain, _super);
        function MethodsMain() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MethodsMain.prototype.render = function () {
            return React.createElement("div", { className: 'container' },
                React.createElement(ChannelsDB.Menu, null),
                React.createElement(ChannelsDB.Methods, null),
                React.createElement(Footer, null));
        };
        return MethodsMain;
    }(React.Component));
    var DocumentationMain = (function (_super) {
        __extends(DocumentationMain, _super);
        function DocumentationMain() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DocumentationMain.prototype.render = function () {
            return React.createElement("div", { className: 'container' },
                React.createElement(ChannelsDB.Menu, null),
                React.createElement(ChannelsDB.Documentation, null),
                React.createElement(Footer, null));
        };
        return DocumentationMain;
    }(React.Component));
    var ContributeMain = (function (_super) {
        __extends(ContributeMain, _super);
        function ContributeMain() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ContributeMain.prototype.render = function () {
            return React.createElement("div", { className: 'container' },
                React.createElement(ChannelsDB.Menu, null),
                React.createElement(ChannelsDB.Contribute, null),
                React.createElement(Footer, null));
        };
        return ContributeMain;
    }(React.Component));
    var GDPRMain = (function (_super) {
        __extends(GDPRMain, _super);
        function GDPRMain() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        GDPRMain.prototype.render = function () {
            return React.createElement("div", { className: 'container' },
                React.createElement(ChannelsDB.Menu, null),
                React.createElement(ChannelsDB.GDPR, null),
                React.createElement(Footer, null));
        };
        return GDPRMain;
    }(React.Component));
    var AboutMain = (function (_super) {
        __extends(AboutMain, _super);
        function AboutMain() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        AboutMain.prototype.render = function () {
            return React.createElement("div", { className: 'container' },
                React.createElement(ChannelsDB.Menu, null),
                React.createElement(ChannelsDB.About, null),
                React.createElement(Footer, null));
        };
        return AboutMain;
    }(React.Component));
    var Footer = (function (_super) {
        __extends(Footer, _super);
        function Footer() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Footer.prototype.render = function () {
            return React.createElement("footer", null,
                React.createElement("hr", { className: 'featurette-divider' }),
                React.createElement("p", { className: 'pull-right', style: { color: '#999', fontSize: 'smaller', marginBottom: '30px' } },
                    "\u00A9 2018 Luk\u00E1\u0161 Pravda & David Sehnal;  2023 Anna \u0160pa\u010Dkov\u00E1 & V\u00E1clav Bazgier | ",
                    React.createElement("a", { href: "gdpr.html" }, "Terms of Use & GDPR ")));
        };
        return Footer;
    }(React.Component));
    var SearchView = (function (_super) {
        __extends(SearchView, _super);
        function SearchView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SearchView.prototype.render = function () {
            return React.createElement("div", { style: { marginTop: '20px' } },
                React.createElement("div", { className: 'row' },
                    React.createElement("div", { className: 'col-lg-12' },
                        React.createElement(SearchBox, __assign({}, this.props)))),
                React.createElement("div", { className: 'row' },
                    React.createElement("div", { className: 'col-lg-12' },
                        React.createElement(AlphaFillSearchBox, __assign({}, this.props)))),
                React.createElement("div", { className: 'row' },
                    React.createElement("div", { className: 'col-lg-12' },
                        React.createElement(StateView, __assign({}, this.props)))));
        };
        return SearchView;
    }(React.Component));
    var StateView = (function (_super) {
        __extends(StateView, _super);
        function StateView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        StateView.prototype.componentDidMount = function () {
            var _this = this;
            this.props.state.stateUpdated.subscribe(function () { return _this.forceUpdate(); });
        };
        StateView.prototype.render = function () {
            var state = this.props.state.viewState;
            try {
                switch (state.kind) {
                    case 'Info': return React.createElement(ChannelsDB.Info, { state: this.props.state });
                    case 'Loading': return React.createElement("div", null, state.message);
                    case 'Searched': return React.createElement(SearchResults, __assign({}, this.props));
                    case 'Entries': return React.createElement(Entries, __assign({}, this.props, { mode: 'Full', value: state.term }));
                    case 'Error': return React.createElement("div", null,
                        "Error: ",
                        state.message);
                    default: return React.createElement("div", null, "Should not happen ;)");
                }
            }
            catch (e) {
                return React.createElement("div", null,
                    "Error: ",
                    '' + e);
            }
        };
        return StateView;
    }(React.Component));
    var SearchBox = (function (_super) {
        __extends(SearchBox, _super);
        function SearchBox() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.state = { isAvailable: false };
            return _this;
        }
        SearchBox.prototype.componentDidMount = function () {
            var _this = this;
            this.props.state.dbContentAvailable.subscribe(function (isAvailable) { return _this.setState({ isAvailable: isAvailable }); });
        };
        SearchBox.prototype.render = function () {
            var _this = this;
            return React.createElement("div", { className: 'form-group form-group-lg' },
                React.createElement("img", { className: "img", src: "assets/img/pdbe_logo.png", alt: "pdbe_logo", height: "30" }),
                this.state.isAvailable
                    ? React.createElement("input", { key: 'fullsearch', type: 'text', className: 'form-control', style: { fontWeight: 'bold', borderColor: 'darkgreen' }, placeholder: 'Search ChannelsDB (e.g., cytochrome p450, 5ebl, KcsA) ...', onChange: function (e) { return _this.props.state.searchTerm.onNext(e.target.value); }, onKeyPress: function (e) {
                            if (e.key !== 'Enter')
                                return;
                            _this.props.state.fullSearch.onNext(void 0);
                            ChannelsDB.updateViewState(_this.props.state, { kind: 'Entries', term: e.target.value });
                        } })
                    : React.createElement("input", { key: 'placeholder', type: 'text', className: 'form-control', style: { fontWeight: 'bold', textAlign: 'left', borderColor: 'darkgreen' }, disabled: true, value: 'Initializing search...' }));
        };
        return SearchBox;
    }(React.Component));
    var AlphaFillSearchBox = (function (_super) {
        __extends(AlphaFillSearchBox, _super);
        function AlphaFillSearchBox() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            //TODO initialize with search of AlphaFill molecules
            _this.state = { isAvailable: false };
            return _this;
        }
        AlphaFillSearchBox.prototype.componentDidMount = function () {
            var _this = this;
            this.props.state.dbContentAvailable.subscribe(function (isAvailable) { return _this.setState({ isAvailable: isAvailable }); });
        };
        AlphaFillSearchBox.prototype.render = function () {
            return React.createElement("div", { className: 'form-group form-group-lg' },
                React.createElement("img", { className: "img", src: "assets/img/alphafill-logo.png", alt: "alphafill_logo", height: "50" }),
                this.state.isAvailable
                    ? React.createElement("input", { key: 'fullsearch', type: 'text', className: 'form-control', style: { fontWeight: 'bold', borderColor: 'darkgreen' }, placeholder: 'Search ChannelsDB for AlphaFill tunnels (P08686)....', 
                        //onChange={(e) => this.props.state.searchTerm.onNext(e.target.value)}
                        onKeyPress: function (e) {
                            if (e.key !== 'Enter') {
                                return;
                            }
                            ;
                            console.log(e.target.value);
                            //TODO check if UNIPROT exists
                            window.open("/detail/alphafill/" + e.target.value, "_blank");
                            // this.props.state.fullSearch.onNext(void 0);
                            // updateViewState(this.props.state, { kind: 'Entries', term: (e.target as any).value });
                        } })
                    : React.createElement("input", { key: 'placeholder', type: 'text', className: 'form-control', style: { fontWeight: 'bold', textAlign: 'left', borderColor: 'darkgreen' }, disabled: true, value: 'Initializing search...' }));
        };
        return AlphaFillSearchBox;
    }(React.Component));
    var SearchResults = (function (_super) {
        __extends(SearchResults, _super);
        function SearchResults() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SearchResults.prototype.empty = function () {
            return React.createElement("div", null, "No results");
        };
        SearchResults.prototype.groups = function () {
            var _this = this;
            var data = this.props.state.viewState.data;
            var groups = data.grouped.category.groups;
            return groups.map(function (g, i) { return React.createElement(SearchGroup, __assign({ key: g.groupValue + '--' + i }, _this.props, { group: g })); });
        };
        SearchResults.prototype.render = function () {
            try {
                var data = this.props.state.viewState.data;
                if (!data.grouped.category.groups.length)
                    return this.empty();
                return React.createElement("div", null,
                    React.createElement("div", { style: { padding: '0 0 15px 0', marginTop: '-15px', fontStyle: 'italic', textAlign: 'right' } },
                        React.createElement("small", null, "Press 'Enter' for full-text search.")),
                    React.createElement("div", null, this.groups()));
            }
            catch (e) {
                return this.empty();
            }
        };
        return SearchResults;
    }(React.Component));
    var SearchGroup = (function (_super) {
        __extends(SearchGroup, _super);
        function SearchGroup() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.state = { isExpanded: false, docs: [], isLoading: false, entries: void 0 };
            _this.toggle = function (e) {
                e.preventDefault();
                _this.setState({ isExpanded: !_this.state.isExpanded });
            };
            _this.showEntries = function (e) {
                e.preventDefault();
                var value = e.target.getAttribute('data-value');
                var var_name = e.target.getAttribute('data-var');
                var count = +e.target.getAttribute('data-count');
                _this.setState({ entries: { group: _this.props.group.groupValue, value: value, var_name: var_name, count: count } });
            };
            _this.loadMore = function () { return __awaiter(_this, void 0, void 0, function () {
                var docs, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            this.setState({ isLoading: true });
                            return [4 /*yield*/, ChannelsDB.searchPdbCategory(this.props.state.searchedTerm, this.state.docs[0].var_name, this.state.docs.length)];
                        case 1:
                            docs = _a.sent();
                            this.setState({ isLoading: false, docs: this.state.docs.concat(docs) });
                            return [3 /*break*/, 3];
                        case 2:
                            e_1 = _a.sent();
                            this.setState({ isLoading: false });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); };
            return _this;
        }
        SearchGroup.prototype.componentDidMount = function () {
            this.setState({ docs: this.props.group.doclist.docs });
        };
        SearchGroup.prototype.entry = function (d, i) {
            return React.createElement("div", { key: d.value + d.var_name + '--' + i },
                React.createElement("a", { href: '#', "data-value": d.value, "data-var": d.var_name, "data-count": d.num_pdb_entries, onClick: this.showEntries, title: "" + d.value }, d.value),
                React.createElement("div", { className: 'count' }, d.num_pdb_entries));
        };
        SearchGroup.prototype.render = function () {
            var _this = this;
            var g = this.props.group;
            return React.createElement("div", { style: { marginBottom: '10px' } },
                React.createElement("div", { className: 'group-header' },
                    React.createElement("button", { className: 'btn btn-default btn-block', onClick: this.toggle },
                        React.createElement("span", { className: "glyphicon glyphicon-" + (this.state.isExpanded ? 'minus' : 'plus'), "aria-hidden": 'true' }),
                        " ",
                        React.createElement("span", null, g.groupValue),
                        " (",
                        g.doclist.numFound,
                        ")")),
                React.createElement("div", { className: 'group-list-wrap', style: { display: this.state.entries ? 'none' : 'block' } },
                    React.createElement("div", { className: 'group-list', style: { display: this.state.isExpanded ? 'block' : 'none' } },
                        this.state.docs.map(function (d, i) { return _this.entry(d, i); }),
                        this.state.docs.length < g.doclist.numFound
                            ? React.createElement("div", { style: { padding: 0, float: 'none', clear: 'both' } },
                                React.createElement("button", { style: { width: '100%', display: 'block' }, className: 'btn btn-xs btn-primary btn-block', disabled: this.state.isLoading ? true : false, onClick: this.loadMore }, this.state.isLoading ? 'Loading...' : "More (" + (g.doclist.numFound - this.state.docs.length) + " remaining)"))
                            : void 0),
                    React.createElement("div", { style: { clear: 'both' } })),
                this.state.entries && this.state.isExpanded
                    ? React.createElement("div", { className: 'entry-list-wrap' },
                        React.createElement("button", { className: 'btn btn-block btn-primary', onClick: function () { return _this.setState({ entries: void 0 }); } },
                            React.createElement("span", { className: "glyphicon glyphicon-chevron-left", "aria-hidden": 'true' })),
                        React.createElement(Entries, __assign({ state: this.props.state }, this.state.entries, { mode: 'Embed' })))
                    : void 0);
        };
        return SearchGroup;
    }(React.Component));
    var Entry = (function (_super) {
        __extends(Entry, _super);
        function Entry() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Entry.prototype.render = function () {
            var docs = this.props.docs;
            var pdbContentMap = ['CSATunnels MOLE', 'CSATunnels Caver', 'ReviewedChannels MOLE', 'ReviewedChannels Caver',
                'CofactorTunnels MOLE', 'CofactorTunnels Caver', 'TransmembranePores MOLE', 'TransmembranePores Caver', 'ProcognateTunnels MOLE',
                'ProcagnateTunnels Caver'];
            var alphafillContentMap = ['AlphaFillTunnels MOLE', 'AlphaFillTunnels Caver'];
            var pdb = this.props.state.dbContent.pdb[ChannelsDB.toLower(docs.pdb_id)];
            var alphafill = this.props.state.dbContent.alphafill[ChannelsDB.toLower(docs.pdb_id)];
            var numPdbChannels = pdb ? pdb.reduce(function (a, b) { return a + b; }, 0) : -1;
            var numAlphafillChannels = alphafill ? alphafill.reduce(function (a, b) { return a + b; }, 0) : -1;
            var pdbContent = numPdbChannels > 0 ? pdb.map(function (el, index) { return el > 0 ? pdbContentMap[index] + ' (' + el + ')' : ''; }) : [];
            var alphafillContent = numAlphafillChannels > 0 ? pdb.map(function (el, index) { return el > 0 ? alphafillContentMap[index] + ' (' + el + ')' : ''; }) : [];
            var msgPdb = numPdbChannels > 0 ? pdbContent.filter(function (a) { return a.length > 0; }).reduce(function (a, b) { return a + ', ' + b; }) : '';
            var msgAlphafill = numAlphafillChannels > 0 ? alphafillContent.filter(function (a) { return a.length > 0; }).reduce(function (a, b) { return a + ', ' + b; }) : '';
            return React.createElement("div", { className: 'well pdb-entry' },
                React.createElement("a", { href: "/detail/pdb/" + docs.pdb_id, target: '_blank' },
                    React.createElement("div", { className: 'pdb-entry-header', style: { background: pdb ? '#dfd' : '#ddd' } },
                        React.createElement("div", null, docs.pdb_id),
                        React.createElement("div", { title: docs.title || 'n/a' }, docs.title || 'n/a'))),
                React.createElement("ul", null,
                    React.createElement("li", null,
                        React.createElement("b", null, "Experiment Method:"),
                        " ",
                        (docs.experimental_method || ['n/a']).join(', '),
                        " | ",
                        docs.resolution || 'n/a',
                        " \u00C5"),
                    React.createElement("li", null,
                        React.createElement("b", null, "Organism:"),
                        " ",
                        React.createElement("i", null, (docs.organism_scientific_name || ['n/a']).join(', '))),
                    numPdbChannels > 0
                        ? React.createElement("li", null,
                            React.createElement("i", null, numPdbChannels + " channel" + (numPdbChannels !== 1 ? 's' : '') + "; " + msgPdb))
                        :
                            numAlphafillChannels > 0
                                ? React.createElement("li", null,
                                    React.createElement("i", null, numAlphafillChannels + " channel" + (numAlphafillChannels !== 1 ? 's' : '') + "; " + msgAlphafill)) : void 0),
                React.createElement("div", { className: 'pdb-entry-img-wrap' },
                    React.createElement("img", { src: "/api/download/pdb/" + docs.pdb_id.toLowerCase() + "/png" })));
        };
        return Entry;
    }(React.Component));
    var Entries = (function (_super) {
        __extends(Entries, _super);
        function Entries() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.state = { isLoading: false, entries: [], count: -1, showing: 0, withCount: -1, withoutCount: -1 };
            _this.fetchEmbed = function () { return __awaiter(_this, void 0, void 0, function () {
                var _a, entries, withCount, withoutCount, e_2;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 2, , 3]);
                            this.setState({ isLoading: true });
                            return [4 /*yield*/, ChannelsDB.fetchPdbEntries(this.props.state, this.props.var_name, this.props.value)];
                        case 1:
                            _a = _c.sent(), entries = _a.entries, withCount = _a.withCount, withoutCount = _a.withoutCount;
                            this.setState({ isLoading: false, entries: entries, count: withCount + withoutCount, withCount: withCount, withoutCount: withoutCount, showing: this.growFactor });
                            return [3 /*break*/, 3];
                        case 2:
                            e_2 = _c.sent();
                            this.setState({ isLoading: false });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); };
            _this.fetchFull = function () { return __awaiter(_this, void 0, void 0, function () {
                var _a, entries, withCount, withoutCount, e_3;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 2, , 3]);
                            this.setState({ isLoading: true });
                            return [4 /*yield*/, ChannelsDB.fetchPdbText(this.props.state, this.props.value)];
                        case 1:
                            _a = _c.sent(), entries = _a.entries, withCount = _a.withCount, withoutCount = _a.withoutCount;
                            this.setState({ isLoading: false, entries: entries, count: withCount + withoutCount, withCount: withCount, withoutCount: withoutCount, showing: this.growFactor });
                            return [3 /*break*/, 3];
                        case 2:
                            e_3 = _c.sent();
                            this.setState({ isLoading: false });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); };
            _this.loadMore = function () { return _this.setState({ showing: _this.state.showing + _this.growFactor }); };
            _this.growFactor = _this.props.mode === 'Embed' ? 6 : 12;
            _this.fetch = _this.props.mode === 'Embed' ? _this.fetchEmbed : _this.fetchFull;
            return _this;
        }
        Entries.prototype.componentDidMount = function () {
            this.fetch();
        };
        Entries.prototype.render = function () {
            var groups = this.state.entries;
            var entries = [];
            for (var i = 0, _b = Math.min(this.state.showing, this.state.entries.length); i < _b; i++) {
                entries.push(React.createElement(Entry, { key: i, state: this.props.state, docs: groups[i].doclist.docs[0] }));
            }
            return React.createElement("div", null,
                this.props.mode === 'Embed'
                    ? React.createElement("h4", null,
                        React.createElement("b", null, this.props.group),
                        ": ",
                        this.props.value,
                        " ",
                        React.createElement("small", null,
                            "(",
                            this.state.withCount === 0 ? "No systems with channels!" : this.state.count + "; " + this.state.withCount + " with channels",
                            ")"))
                    : React.createElement("h4", null,
                        React.createElement("b", null, "Search"),
                        ": ",
                        this.props.value,
                        " ",
                        React.createElement("small", null,
                            "(",
                            this.state.count >= 0 ? this.state.count + "; " + this.state.withCount + " with channels" : '?',
                            ")")),
                this.state.isLoading ? React.createElement("div", null, "Loading...") : void 0,
                React.createElement("div", { style: { marginTop: '15px', position: 'relative' } },
                    entries,
                    React.createElement("div", { style: { clear: 'both' } }),
                    this.state.showing < this.state.count
                        ? React.createElement("button", { className: 'btn btn-sm btn-primary btn-block', disabled: this.state.isLoading ? true : false, onClick: this.loadMore }, this.state.isLoading ? 'Loading...' : "Show more (" + (this.state.count > 0 ? this.state.count - this.state.showing : '?') + " remaining; " + Math.max(this.state.withCount - this.state.showing, 0) + " with channels)")
                        : void 0));
        };
        return Entries;
    }(React.Component));
})(ChannelsDB || (ChannelsDB = {}));
/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var ChannelsDB;
(function (ChannelsDB) {
    var Intro = (function (_super) {
        __extends(Intro, _super);
        function Intro() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.sub = void 0;
            _this.state = { statistics: _this.props.state.statistics, statisticsExpanded: false };
            return _this;
        }
        Intro.prototype.toggle = function (e) {
            e.preventDefault();
            this.setState({ statisticsExpanded: !this.state.statisticsExpanded });
        };
        Intro.prototype.componentDidMount = function () {
            var _this = this;
            if (!this.state.statistics) {
                this.sub = this.props.state.statisticsAvailable.subscribe(function (statistics) { return _this.setState({ statistics: statistics }); });
            }
        };
        Intro.prototype.componentWillUnmount = function () {
            if (this.sub) {
                this.sub.dispose();
                this.sub = void 0;
            }
        };
        Intro.prototype.render = function () {
            var _this = this;
            var stats = this.state.statistics;
            var reference = {
                borderLeft: '2px solid #AAA',
                paddingLeft: 6,
            };
            return React.createElement("div", null,
                React.createElement("div", { className: 'row' },
                    React.createElement("div", { className: 'well row table-responsive', style: { marginTop: '0', marginBottom: '40px' } },
                        React.createElement("div", { className: "text-center" },
                            "ChannelsDB last update on ",
                            React.createElement("b", null, stats ? stats.date : 'n/a'),
                            "\u00A0",
                            React.createElement("small", null, "contains:"),
                            React.createElement("b", null,
                                " ",
                                stats ? stats.Total : 'n/a'),
                            " entries \u00A0",
                            React.createElement("a", { href: "_blank", onClick: function (e) { return _this.toggle(e); } }, "Show more/less")),
                        React.createElement("table", { className: "table table-condensed active w-auto", style: { display: this.state.statisticsExpanded ? 'table' : 'none' } },
                            React.createElement("thead", null,
                                React.createElement("tr", null,
                                    React.createElement("th", null,
                                        React.createElement("b", null, "Channel type")),
                                    React.createElement("th", null,
                                        React.createElement("b", null, "MOLE")),
                                    React.createElement("th", null,
                                        React.createElement("b", null, "CAVER")))),
                            React.createElement("tbody", null,
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Reviewed"),
                                    React.createElement("td", null,
                                        React.createElement("b", null, stats && stats.statistics.ReviewedChannels_MOLE ? stats.statistics.ReviewedChannels_MOLE : 'n/a')),
                                    React.createElement("td", null,
                                        React.createElement("b", null, stats && stats.statistics.ReviewedChannels_Caver ? stats.statistics.ReviewedChannels_Caver : 'n/a'))),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "CSA"),
                                    React.createElement("td", null,
                                        React.createElement("b", null, stats && stats.statistics.CSATunnels_MOLE ? stats.statistics.CSATunnels_MOLE : 'n/a')),
                                    React.createElement("td", null,
                                        React.createElement("b", null, stats && stats.statistics.CSATunnels_Caver ? stats.statistics.CSATunnels_Caver : 'n/a'))),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Cofactor"),
                                    React.createElement("td", null,
                                        React.createElement("b", null, stats && stats.statistics.CofactorTunnels_MOLE ? stats.statistics.CofactorTunnels_MOLE : 'n/a')),
                                    React.createElement("td", null,
                                        React.createElement("b", null, stats && stats.statistics.CofactorTunnels_Caver ? stats.statistics.CofactorTunnels_Caver : 'n/a'))),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Transmembrane pores"),
                                    React.createElement("td", null,
                                        React.createElement("b", null, stats && stats.statistics.TransmembranePores_MOLE ? stats.statistics.TransmembranePores_MOLE : 'n/a')),
                                    React.createElement("td", null,
                                        React.createElement("b", null, stats && stats.statistics.TransmembranePores_Caver ? stats.statistics.TransmembranePores_Caver : 'n/a'))),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Procognate"),
                                    React.createElement("td", null,
                                        React.createElement("b", null, stats && stats.statistics.ProcognateTunnels_MOLE ? stats.statistics.ProcognateTunnels_MOLE : 'n/a')),
                                    React.createElement("td", null,
                                        React.createElement("b", null, stats && stats.statistics.ProcagnateTunnels_Caver ? stats.statistics.ProcagnateTunnels_Caver : 'n/a'))),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "AlphaFill"),
                                    React.createElement("td", null,
                                        React.createElement("b", null, stats && stats.statistics.AlphaFillTunnels_MOLE ? stats.statistics.AlphaFillTunnels_MOLE : 'n/a')),
                                    React.createElement("td", null,
                                        React.createElement("b", null, stats && stats.statistics.AlphaFillTunnels_Caver ? stats.statistics.AlphaFillTunnels_Caver : 'n/a')))))),
                    React.createElement("div", { className: 'col-lg-9', style: { textAlign: 'left', textJustify: 'inter-word', padding: '0' } },
                        React.createElement("p", { className: "lead" },
                            "ChannelsDB database is located at ",
                            React.createElement("a", { target: "_blank", href: "https://channelsdb.ncbr.muni.cz/" }, "https://channelsdb.ncbr.muni.cz/"),
                            "."),
                        React.createElement("p", { className: "lead" },
                            "ChannelsDB 2.0 is a comprehensive and regularly updated resource of channels, pores and tunnels found in biomacromolecules deposited in the ",
                            React.createElement("a", { target: "_blank", href: "https://www.ebi.ac.uk/pdbe/" }, "Protein Data Bank"),
                            " and ",
                            React.createElement("a", { target: "_blank", href: "https://alphafill.eu/" }, "AlphaFill"),
                            " / ",
                            React.createElement("a", { target: "_blank", href: "https://alphafold.ebi.ac.uk/" }, "AlphaFold"),
                            " databases. As such, it is a unique service for channel-related analyses. Pathways were calculated using an algorithms ",
                            React.createElement("a", { target: "_blank", href: "https://loschmidt.chemi.muni.cz/caverweb/" }, "CAVER"),
                            " and ",
                            React.createElement("a", { target: "_blank", href: "https://mole.upol.cz/" }, "MOLE"),
                            "."),
                        React.createElement("p", { className: 'text-justify' },
                            "The database contains information about channel positions, geometry and physicochemical properties. Additionally, all the entries are crosslinked with the ",
                            React.createElement("a", { href: 'https://www.uniprot.org', target: '_blank' }, "UniProt database"),
                            " a comprehensive high-quality resource of protein function information. Last but not least, all the results are displayed in a clear interactive manner further facilitating data interpretation. "),
                        React.createElement("p", null,
                            "If you would like to provide your own research results to be displayed soon as a part of Protein Data Bank in Europe. ",
                            React.createElement("a", { href: 'mailto:webchemistryhelp@gmail.com' }, "Get in touch with us"),
                            ", or use the ",
                            React.createElement("a", { href: 'contribute.html' }, "annotation form"),
                            "."),
                        React.createElement("hr", { className: 'featurette-divider', style: { margin: '10px 0' } }),
                        React.createElement("p", null, "Should you find this resource useful, please cite it as:"),
                        React.createElement("p", { style: reference },
                            React.createElement("small", null,
                                React.createElement("a", { href: 'https://dx.doi.org/10.1093/nar/gkx868', target: '_blank' }, " Pravda,L., et al. (2018) ChannelsDB: database of biomacromolecular tunnels and pores. Nucleic Acids Res., 46, D399\u2013D405.")))),
                    React.createElement("div", { className: 'channelsdb-logo col-lg-3' },
                        React.createElement("a", { href: 'https://dx.doi.org/10.1093/nar/gkx868', target: '_blank' },
                            React.createElement("img", { src: 'assets/img/channelsdb_cover.png', style: { width: '100%' } })))));
        };
        return Intro;
    }(React.Component));
    ChannelsDB.Intro = Intro;
    var Info = (function (_super) {
        __extends(Info, _super);
        function Info() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Info.prototype.render = function () {
            var centerStyle = {
                display: 'block',
                margin: '0 auto',
                marginTop: 0,
            };
            var justify = {
                textAlign: 'justify',
                textJustify: 'inter-word',
            };
            var reference = {
                borderLeft: '2px solid #AAA',
                paddingLeft: 6,
            };
            return React.createElement("div", { style: { marginTop: '0px' } },
                React.createElement(Intro, { state: this.props.state }),
                React.createElement("div", { className: 'row', style: { marginTop: '30px' } },
                    React.createElement("div", { className: 'col-lg-12' },
                        React.createElement("h2", { style: { textAlign: 'center', margin: '0 0 20px 0', fontWeight: 'bold' } }, "Examples"),
                        React.createElement("div", { className: 'well' },
                            React.createElement("div", null,
                                React.createElement("div", { className: 'col-lg-4' },
                                    React.createElement("a", { href: '/detail/pdb/1ymg' },
                                        React.createElement("img", { style: centerStyle, className: 'img-circle', src: 'assets/img/1ymg.png', alt: '1ymg channel detail', width: '140', height: '140' })),
                                    React.createElement("a", { href: '#ex-1ymg', role: 'button' },
                                        React.createElement("h3", null, "Aquaporin water channel")),
                                    React.createElement("p", { style: justify }, "The pore architecture of Aquaporin O at 2.2\u212B resolution highlights residues critical for water permeation regulation.")),
                                React.createElement("div", { className: 'col-lg-4' },
                                    React.createElement("a", { href: '/detail/pdb/4nm9' },
                                        React.createElement("img", { style: centerStyle, className: 'img-circle', src: 'assets/img/4nm9.png', alt: '4nm9 channel detail', width: '140', height: '140' })),
                                    React.createElement("a", { href: '#ex-4nm9', role: 'button' },
                                        React.createElement("h3", null, "Substrate channeling system")),
                                    React.createElement("p", { style: justify }, "Proline utilization A protein contains two active sites separated by ~75\u212B long channeling system accompanied by a complex network of channels.")),
                                React.createElement("div", { className: 'col-lg-4' },
                                    React.createElement("a", { href: '/detail/pdb/1jj2' },
                                        React.createElement("img", { style: centerStyle, className: 'img-circle', src: 'assets/img/1jj2.png', alt: '1jj2 channel detail', width: '140', height: '140' })),
                                    React.createElement("a", { href: '#ex-1jj2', role: 'button' },
                                        React.createElement("h3", null, "Ribosomal polypeptide exit tunnel")),
                                    React.createElement("p", { style: justify }, "Ribosomal polypeptide exit tunnel directs a nascent protein from the peptidyl transferase center to the outside of the ribosome."))),
                            React.createElement("div", { className: 'row', style: { margin: '20px 0' } },
                                React.createElement("div", { className: 'col-lg-4' },
                                    React.createElement("a", { className: 'btn btn-block btn-default', href: '#ex-1ymg', role: 'button' }, "View details \u00BB")),
                                React.createElement("div", { className: 'col-lg-4' },
                                    React.createElement("a", { className: 'btn btn-block btn-default', href: '#ex-4nm9', role: 'button' }, "View details \u00BB")),
                                React.createElement("div", { className: 'col-lg-4' },
                                    React.createElement("a", { className: 'btn btn-block btn-default', href: '#ex-1jj2', role: 'button' }, "View details \u00BB"))),
                            React.createElement("div", null,
                                React.createElement("div", { className: 'col-lg-6' },
                                    React.createElement("a", { href: '/detail/pdb/3tbg' },
                                        React.createElement("img", { style: centerStyle, className: 'img-circle', src: 'assets/img/3tbg.png', alt: '3tbg channel detail', width: '140', height: '140' })),
                                    React.createElement("a", { href: '#ex-3tbg', role: 'button' },
                                        React.createElement("h3", null, "Cytochrome P450 2D6 tunnels in experimental structure")),
                                    React.createElement("p", { style: justify }, "Cytochromes P450 are known for complex net of multiple channels leading towards the active site. These channels serve multiple roles.")),
                                React.createElement("div", { className: 'col-lg-6' },
                                    React.createElement("a", { href: '/detail/alphafill/P10635' },
                                        React.createElement("img", { style: centerStyle, className: 'img-circle', src: 'assets/img/alphafill_example.png', alt: 'P10635 channel detail', width: '140', height: '140' })),
                                    React.createElement("a", { href: '#ex-P10635', role: 'button' },
                                        React.createElement("h3", null, "Cytochrome P450 2D6 tunnels in Alphafill model")),
                                    React.createElement("p", { style: justify }, "Complex net of multiple channels in cytochrome P450 2D6 leading towards the active site is visible even in AlphaFold structures."))),
                            React.createElement("div", { className: 'row', style: { margin: '20px 0' } },
                                React.createElement("div", { className: 'col-lg-6' },
                                    React.createElement("a", { className: 'btn btn-block btn-default', href: '#ex-3tbg', role: 'button' }, "View details \u00BB")),
                                React.createElement("div", { className: 'col-lg-6' },
                                    React.createElement("a", { className: 'btn btn-block btn-default', href: '#ex-P10635', role: 'button' }, "View details \u00BB")))))),
                React.createElement("div", { className: 'row featurette', style: { marginTop: '40px' } },
                    React.createElement('a', { 'name': 'ex-1ymg' }),
                    React.createElement("div", { className: 'col-md-7' },
                        React.createElement("a", { href: '/detail/pdb/1ymg' },
                            React.createElement("h2", { className: 'featurette-heading' },
                                "Aquaporin O ",
                                React.createElement("span", { className: 'text-muted' }, "(1ymg)"))),
                        React.createElement("p", { style: justify, className: 'lead' }, "The pore architecture of Aquaporin O at 2.2\u212B resolution highlights residues critical for water permeation regulation."),
                        React.createElement("p", { style: justify }, "The channel is ~ 30\u212B long and highlights with some of the residues crucial for its proper function. Selectivity filter (ar/R), which allows water molecules passage through the membrane in a single file (green sticks). Residues providing canonical AQP hydrogen bond acceptor that align waters through the channel in balls and stick model. Finally, Tyr-149 important for channel gating (orange)."),
                        React.createElement("p", { style: reference },
                            React.createElement("small", null,
                                React.createElement("a", { target: '_blank', href: 'https://dx.doi.org/10.1073/pnas.0405274101' },
                                    "Harries, W. E. C., et. al. ",
                                    React.createElement("span", { style: { fontStyle: 'italic' } }, "The channel architecture of aquaporin 0 at a 2.2\u212B resolution"),
                                    ". Proc. Natl. Acad. Sci. 101, 14045\u201314050 (2004)")))),
                    React.createElement("div", { className: 'col-md-5' },
                        React.createElement("img", { className: 'featurette-image img-responsive center-block', src: 'assets/img/1ymg_detail.png', width: '500', height: '500', alt: '1ymg detailed channel view' }))),
                React.createElement("hr", { className: 'featurette-divider', style: { margin: '40px 0' } }),
                React.createElement("div", { className: 'row featurette' },
                    React.createElement('a', { 'name': 'ex-3tbg' }),
                    React.createElement("div", { className: 'col-md-7 col-md-push-5' },
                        React.createElement("a", { href: '/detail/pdb/3tbg' },
                            React.createElement("h2", { className: 'featurette-heading' },
                                "Cytochrome P450 2D6 experimental ",
                                React.createElement("br", null),
                                "structures",
                                React.createElement("span", { className: 'text-muted' }, "(3tbg)"))),
                        React.createElement("p", { style: justify, className: 'lead' }, "Cytochromes P450 are known for complex net of multiple channels leading towards active site. These channels serve multiple roles in substrate access, product release or hydration pathways."),
                        React.createElement("p", { style: justify },
                            "Cytochrome  P450  2D6  contributes  significantly  to  the  metabolism  of  >15%  of  the  200  most marketed drugs. Cytochrome P450 2D6 structure shows a second molecule of thioridazine bound in an expanded substrate access channel (channel 2f according to ",
                            React.createElement("a", { href: 'https://doi.org/10.1016/j.bbagen.2006.07.005', target: '_blank' }, "Cojocaru et al. classification"),
                            "  antechamber  with  its  piperidine  moiety  forming  a charge-stabilized hydrogen bond with Glu-222."),
                        React.createElement("p", { style: reference },
                            React.createElement("small", null,
                                React.createElement("a", { target: '_blank', href: 'https://dx.doi.org/10.1074/jbc.M114.627661' },
                                    "Wang, A., et al. ",
                                    React.createElement("span", { style: { fontStyle: 'italic' } }, "Contributions of Ionic Interactions and Protein Dynamics to Cytochrome P450 2D6 (CYP2D6) Substrate and Inhibitor Binding"),
                                    " J.Biol.Chem. 290: 5092-5104 (2015)")))),
                    React.createElement("div", { className: 'col-md-5 col-md-pull-7' },
                        React.createElement("img", { className: 'featurette-image img-responsive center-block', src: 'assets/img/3tbg_detail.png', alt: 'Cytochrome P450 substrate channel details' }))),
                React.createElement("hr", { className: 'featurette-divider', style: { margin: '40px 0' } }),
                React.createElement("div", { className: 'row featurette' },
                    React.createElement('a', { 'name': 'ex-P10635' }),
                    React.createElement("div", { className: 'col-md-7 ' },
                        React.createElement("a", { href: '/detail/alphafill/P10635' },
                            React.createElement("h2", { className: 'featurette-heading' },
                                "Cytochrome P450 2D6 Alphafill models",
                                React.createElement("span", { className: 'text-muted' }, "(P10635)"))),
                        React.createElement("p", { style: justify, className: 'lead' }, "Cytochromes P450 channels starts at HEM cofactor, which can be used to guide channels even in AlphaFill models."),
                        React.createElement("p", { style: justify }, "As mentioned above, Cytochrome P450 2D6 contributes significantly to the metabolism of >15% of the 200 most marketed drugs. Cytochrome P450 2D6 structure shows a second molecule of thioridazine bound in an expanded substrate access channel (channel 2f according to Cojocaru et al. classification antechamber with its piperidine moiety forming a charge-stabilized hydrogen bond with Glu-222)."),
                        React.createElement("p", { style: reference },
                            React.createElement("small", null,
                                React.createElement("a", { target: '_blank', href: 'https://dx.doi.org/10.1074/jbc.M114.627661' },
                                    "Wang, A., et al.  ",
                                    React.createElement("span", { style: { fontStyle: 'italic' } }, "Contributions of Ionic Interactions and Protein Dynamics to Cytochrome P450 2D6 (CYP2D6) Substrate and Inhibitor Binding"),
                                    " J.Biol.Chem. 290: 5092-5104 (2015)")))),
                    React.createElement("div", { className: 'col-md-5' },
                        React.createElement("img", { className: 'featurette-image img-responsive center-block', src: 'assets/img/alphafill_example.png', alt: 'Cytochrome P450 substrate channel details' }))),
                React.createElement("hr", { className: 'featurette-divider', style: { margin: '40px 0' } }),
                React.createElement("div", { className: 'row featurette' },
                    React.createElement('a', { 'name': 'ex-1jj2' }),
                    React.createElement("div", { className: 'col-md-7 ' },
                        React.createElement("a", { href: '/detail/pdb/1jj2' },
                            React.createElement("h2", { className: 'featurette-heading' },
                                "Large Ribosomal Subunit ",
                                React.createElement("span", { className: 'text-muted' }, "(1jj2)"))),
                        React.createElement("p", { style: justify, className: 'lead' }, "The ribosomal polypeptide tunnel provides an insight into the release of a nascent polypeptide chain out of the ribosomal complex."),
                        React.createElement("p", { style: justify }, "The exit tunnel is surrounded by arginine side chains (stick model), bearing positive charges as well as RNA backbone phosphate groups (spheres), thus providing fragmental charge along the tunnel, which is necessary to prevent the nascent peptide from sticking to the channel wall inside the ribosome. Subunits L4, L22 and L39e interacting with the exit tunnel are highlighted in yellow, green and magenta respectivelly."),
                        React.createElement("p", { style: reference },
                            React.createElement("small", null,
                                React.createElement("a", { target: '_blank', href: 'https://dx.doi.org/10.1016/j.jmb.2006.05.023' },
                                    "Voss, N. R., et. al. ",
                                    React.createElement("span", { style: { fontStyle: 'italic' } }, "The geometry of the ribosomal polypeptide exit tunnel."),
                                    ". J. Mol. Biol. 360, 893\u2013906 (2006)")))),
                    React.createElement("div", { className: 'col-md-5 ' },
                        React.createElement("img", { className: 'featurette-image img-responsive center-block', src: 'assets/img/1jj2_detail.png', alt: 'Polypeptide exit tunnel' }))),
                React.createElement("hr", { className: 'featurette-divider', style: { margin: '40px 0' } }),
                React.createElement("div", { className: 'row featurette' },
                    React.createElement('a', { 'name': 'ex-4nm9' }),
                    React.createElement("div", { className: 'col-md-7 col-md-push-5' },
                        React.createElement("a", { href: '/detail/pdb/4nm9' },
                            React.createElement("h2", { className: 'featurette-heading' },
                                "PutA channeling system ",
                                React.createElement("span", { className: 'text-muted' }, "(4nm9)"))),
                        React.createElement("p", { style: justify, className: 'lead' }, "Substrate channeling is a process of passing intermediate metabolic product from one reaction site to another through intramolecular tunnel."),
                        React.createElement("p", { style: justify }, "In Gram-negative bacteria a proline catabolism is exerted by a single protein combining two different enzymes commonly known as Proline utilization A protein (PutA). The active sites of flavoenzyme proline dehydrogenase (PRODH) and \u2206-1-pyrroline-5-carboxylate dehydrogenase (P5CDH) are connected by ~75\u212B long channel throughout the hydrolysis cavity. Both active sites are supplied by a network of channels for substrate, water consumed by hydrolysis and egress channel for the product - L-glutamate."),
                        React.createElement("p", { style: reference },
                            React.createElement("small", null,
                                React.createElement("a", { target: '_blank', href: 'https://dx.doi.org/10.1073/pnas.1321621111' },
                                    "Singh,H., et al. ",
                                    React.createElement("span", { style: { fontStyle: 'italic' } }, "Structures of the PutA peripheral membrane flavoenzyme reveal a dynamic substrate-channeling tunnel and the quinone-binding site"),
                                    " Proc. Natl. Acad. Sci., 111, 3389\u20133394. (2014)")))),
                    React.createElement("div", { className: 'col-md-5 col-md-pull-7' },
                        React.createElement("img", { className: 'featurette-image img-responsive center-block', src: 'assets/img/4nm9_detail.png', alt: 'PutA channel system' }))),
                React.createElement("hr", { className: 'featurette-divider', style: { margin: '40px 0' } }),
                React.createElement("hr", { className: 'featurette-divider', style: { margin: '40px 0' } }),
                React.createElement("img", { className: 'img', src: 'assets/img/elixirlogo.png', alt: 'ELIXIR logo', height: '70' }),
                React.createElement("img", { className: "img", src: "assets/img/kfc.jpg", alt: "KFC logo", height: "70" }),
                React.createElement("img", { className: "img", src: "assets/img/upol.jpg", alt: "UPOL logo", height: "70" }),
                React.createElement("img", { className: "img", src: "assets/img/metacentrum.jpg", alt: "METACENTRUM logo", height: "70" }),
                React.createElement("img", { className: "img", src: "assets/img/recetox.jpg", alt: "RECETOX logo", height: "70" }),
                React.createElement("img", { className: "img", src: "assets/img/ceitec.jpg", alt: "CEITEC logo", height: "70" }),
                React.createElement("img", { className: "img", src: "assets/img/muni.jpg", alt: "MUNI logo", height: "70" }),
                React.createElement("div", { className: 'row well well-sm featurette text-center', style: { marginTop: '10px' } },
                    "ChannelsDB is a part of services provided by ",
                    React.createElement("a", { href: 'https://www.elixir-czech.cz/', target: '_blank' }, "ELIXIR"),
                    " \u2013 European research infrastructure for biological information. This work was supported by ELIXIR CZ research infrastructure project (MEYS Grant No: LM2015047) including access to computing and storage facilities. For other services provided by ELIXIR's Czech Republic Node visit ",
                    React.createElement("a", { href: 'https://www.elixir-czech.cz/services', target: '_blank' }, "www.elixir-czech.cz/services"),
                    "."),
                React.createElement(ChannelsDB.ScrollButton, { scrollStepInPx: '50', delayInMs: '10' }));
        };
        return Info;
    }(React.Component));
    ChannelsDB.Info = Info;
})(ChannelsDB || (ChannelsDB = {}));
/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var ChannelsDB;
(function (ChannelsDB) {
    var Menu = (function (_super) {
        __extends(Menu, _super);
        function Menu() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Menu.prototype.render = function () {
            return React.createElement("nav", { className: 'navbar navbar-default' },
                React.createElement("div", { className: 'container-fluid' },
                    React.createElement("div", { className: 'navbar-header' },
                        React.createElement("a", { href: 'index.html' },
                            React.createElement("img", { height: '70', style: { margin: '10px 0' }, src: 'assets/img/channelsdb2_logo.png' }))),
                    React.createElement("div", { id: 'navbar', className: 'navbar-collapse collapse' },
                        React.createElement("ul", { className: 'nav navbar-nav navbar-right' },
                            React.createElement("li", { style: { marginTop: '12px', fontSize: '120%', fontWeight: 'bold' } },
                                React.createElement("a", { href: 'index.html' }, "Search")),
                            React.createElement("li", { style: { marginTop: '12px', fontSize: '120%', fontWeight: 'bold' } },
                                React.createElement("a", { href: 'methods.html' }, "Methods")),
                            React.createElement("li", { style: { marginTop: '12px', fontSize: '120%', fontWeight: 'bold' } },
                                React.createElement("a", { href: 'documentation.html' }, "Documentation")),
                            React.createElement("li", { style: { marginTop: '12px', fontSize: '120%', fontWeight: 'bold' } },
                                React.createElement("a", { href: 'https://mole.upol.cz', target: '_blank' }, "MOLE")),
                            React.createElement("li", { style: { marginTop: '12px', fontSize: '120%', fontWeight: 'bold' } },
                                React.createElement("a", { href: 'https://loschmidt.chemi.muni.cz/caverweb/', target: '_blank' }, "CAVER")),
                            React.createElement("li", { style: { marginTop: '12px', fontSize: '120%', fontWeight: 'bold' } },
                                React.createElement("a", { href: 'contribute.html' }, "Contribute")),
                            React.createElement("li", { style: { marginTop: '12px', fontSize: '120%', fontWeight: 'bold' } },
                                React.createElement("a", { href: 'about.html' }, "About"))))));
        };
        return Menu;
    }(React.Component));
    ChannelsDB.Menu = Menu;
})(ChannelsDB || (ChannelsDB = {}));
/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var ChannelsDB;
(function (ChannelsDB) {
    var Methods = (function (_super) {
        __extends(Methods, _super);
        function Methods() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Methods.prototype.render = function () {
            var justify = {
                textAlign: 'justify',
                textJustify: 'inter-word',
            };
            var reference = {
                borderLeft: '2px solid #AAA',
                paddingLeft: 6,
            };
            return React.createElement("div", { style: { margin: '60px 0 0 20px' } },
                React.createElement("h1", { className: 'text-center' }, "Methods"),
                React.createElement("div", { className: 'row' },
                    React.createElement("div", { className: 'col-md-7' },
                        React.createElement("h2", { className: 'featurette-heading' }, "Channels"),
                        React.createElement("p", { style: justify }, "Channels (tunnels and pores) are highly important structural pathways within proteins and other biomacromolecules. Tunnels connect internal spaces of biomacromolecules with exterior enabling, e.g., substrate/product transport towards enzymes\u2019 active sites, nascent synthetized proteins to leave ribosomal proteosynthetic center via ribosomal exit tunnel, etc. Pores are channels passing through the whole biomacromolecular structure, typically facilitating transport of ions or molecules through cellular biomembranes."),
                        React.createElement("p", { style: justify },
                            "Channel walls are made from surrounding amino acids making up for a specific micro-environment (see e.g. ",
                            React.createElement("a", { href: 'https://dx.doi.org/10.1186/s12859-014-0379-x', target: '_blank' }, "Pravda and Berka et al."),
                            "), which influence to a great extent specificity and selectivity of plethora biologically important processes. Their constitution is especially important in channel's constriction sites such as local minima and bottlenecks, which can function as gatekeepers."),
                        React.createElement("p", { style: justify }, "In the database a channel is represented by its centerline (3D natural spline of a given volume), physicochemical properties and lining residues. Channel volume is formed by the distance to the closest protein atom and decomposed into discrete regions called layers. Each layer is defined by the residues lining it. A new layer starts whenever there is a change in residues lining it along its length. Their size and composition is in turn used for estimating channel's physicochemical properties. These are especially important for local minima and a bottleneck (the narrowest part of the channel)."),
                        React.createElement("p", { style: reference },
                            React.createElement("small", null,
                                React.createElement("a", { href: 'https://dx.doi.org/10.1186/s12859-014-0379-x', target: '_blank' },
                                    "Pravda,L. and Berka,K. et al. ",
                                    React.createElement("i", null, "Anatomy of enzyme channels"),
                                    ". BMC Bioinformatics, 15, 379. (2014)")))),
                    React.createElement("div", { className: 'col-md-5' },
                        React.createElement("img", { style: { margin: '60px 0' }, className: 'featurette-image img-responsive center-block', src: 'assets/img/channel_detail.png', width: '500', height: '500', alt: 'Channel details' }))),
                React.createElement("hr", { className: 'featurette-divider', style: { margin: '50px 0' } }),
                React.createElement("div", { className: 'row featurette' },
                    React.createElement("h2", { className: 'featurette-heading' }, "MOLE"),
                    React.createElement("div", { className: 'col-md-7 col-md-push-5' },
                        React.createElement("p", { style: justify }, "MOLE is a software tool used for channel identification throughout the ChannelsDB. First, the algorithm calculates Delaunay triangulation/Voronoi diagram of the atomic centers (see step (1) in the figure). Next, regions suitable for channel identification are calculated using a set of predefined parameters (2,3). Channel starting and end points are identified in these cavity diagrams (4,5) and the most favourable channels are identified among a set of starting points and ending points (6)."),
                        React.createElement("p", { style: justify },
                            "Once the channels have been identified a unique set of residues surrounding channel volume is retrieved. Given this set of residues, a physicochemical properties such as Hydropathy are computed for each channel and its parts. Individual steps of the algorithm are highlighted at the picture below  and more details on the channel identification can be found in the respective ",
                            React.createElement("a", { href: 'https://dx.doi.org/10.1186/1758-2946-5-39', target: '_blank' }, "paper"),
                            ". Finally, user structures can be analysed using the ",
                            React.createElement("a", { href: 'https://mole.upol.cz', target: '_blank' }, "online"),
                            " as well as the ",
                            React.createElement("a", { href: 'https://webchem.ncbr.muni.cz/Platform/App/Mole', target: '_blank' }, "command-line"),
                            " version of MOLE."),
                        React.createElement("p", { style: reference },
                            React.createElement("small", null,
                                React.createElement("a", { target: '_blank', href: 'https://dx.doi.org/10.1186/1758-2946-5-39' },
                                    "Sehnal,D., et al. ",
                                    React.createElement("span", { style: { fontStyle: 'italic' } }, "MOLE 2.0: advanced approach for analysis of biomacromolecular channels."),
                                    "J. Cheminform., 5, 39. (2013)"))),
                        React.createElement("p", { style: reference },
                            React.createElement("small", null,
                                React.createElement("a", { target: '_blank', href: 'https://dx.doi.org/10.1093/nar/gks363' },
                                    "Berka,K. et al. ",
                                    React.createElement("i", null, "MOLEonline 2.0: interactive web-based analysis of biomacromolecular channels"),
                                    ". Nucleic Acids Res., 40, W222-7. (2012)")))),
                    React.createElement("div", { className: 'col-md-5 col-md-pull-7' },
                        React.createElement("img", { className: 'featurette-image img-responsive center-block', src: 'assets/img/alg_outline.jpg', width: '500', height: '500', alt: 'Channel details' }))),
                React.createElement("hr", { className: 'featurette-divider', style: { margin: '50px 0' } }),
                React.createElement("div", { className: 'row featurette' },
                    React.createElement("h2", { className: 'featurette-heading' }, "CAVER"),
                    React.createElement("div", { className: 'col-md-7 col-md-push-5' },
                        React.createElement("p", { style: justify },
                            "CAVER is a software tool for the detection of tunnels and channels in the protein structures and their ensembles. In the first step, the Voronoi diagram representation of the molecule (A) is constructed and the cost for each Voronoi edge is calculated with respect to its width (B). In the second step, too narrow edges are filtered out and the Djikstra\u2019s algorithm is used to find all shortest paths to the protein surface (C). In the third step, the tunnels are clustered and too similar tunnels are removed. In the last step, the characteristics like length and throughput are calculated for all tunnels and their spherical representation is saved (D). CAVER is available as an ",
                            React.createElement("a", { href: "https://loschmidt.chemi.muni.cz/caverweb/", target: "_blank" }, "online "),
                            "tool, as a ",
                            React.createElement("a", { href: "https://caver.cz/", target: "_blank" }, "command-line "),
                            "program, analytical ",
                            React.createElement("a", { href: "https://caver.cz/index.php?sid=199", target: "_blank" }, "software suite "),
                            "CAVER Analyst, or as a PyMOL ",
                            React.createElement("a", { href: "https://pymolwiki.org/index.php/Caver3", target: "_blank" }, "plugin. ")),
                        React.createElement("p", { style: reference },
                            React.createElement("small", null,
                                React.createElement("a", { target: '_blank', href: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3475669/' },
                                    "Chovancova E, Pavelka A, Benes P, Strnad O, Brezovsky J, Kozlikova B, Gora A, Sustr V, Klvana M, Medek P, Biedermannova L, Sochor J, Damborsky J.",
                                    React.createElement("span", { style: { fontStyle: 'italic' } }, "CAVER 3.0: a tool for the analysis of transport pathways in dynamic protein structures. PLoS Comput Biol. 2012;8(10):e1002708. doi: 10.1371/journal.pcbi.1002708."))))),
                    React.createElement("div", { className: 'col-md-5 col-md-pull-7' },
                        React.createElement("img", { className: 'featurette-image img-responsive center-block', src: 'assets/img/figure_caver.jpg', width: '500', height: '500', alt: 'Channel details' }))),
                React.createElement("hr", { className: 'featurette-divider', style: { margin: '50px 0' } }),
                React.createElement("div", { className: 'row' },
                    React.createElement("h2", { className: 'featurette-heading' }, "Physicochemical properties"),
                    React.createElement("p", null, "Altogether with the position and radius of a channel a set of unique residues constituting the channel walls is reported. This set is in turn used for estimation of a various physicochemical properties.")),
                React.createElement("div", { className: 'row' },
                    React.createElement("div", { className: 'col-md-6' },
                        React.createElement("h2", { className: 'featurette-heading' }, "Hydropathy"),
                        React.createElement("p", { style: justify }, "Hydrophobicity and hydrophilicity are two extremes of a spectrum, commonly referred to as Hydropathy, and relate to the tendency of a molecule to interact with water. Several hydropathy scales have been developed in order to grasp the overall character of proteins or their parts. Kyte-Doolittle scale is a widely applied measure for expressing the hydrophobicity of amino acids residues. Regions with values above 0 are considered hydrophobic in character."),
                        React.createElement("p", null, "The scale is symmetrical in interval from -4.5 (Arg) to 4.5 (Ile)."),
                        React.createElement("p", { style: reference },
                            React.createElement("small", null,
                                React.createElement("a", { target: '_blank', href: 'https://dx.doi.org/10.1016/0022-2836(82)90515-0' },
                                    "Kyte, J. & Doolittle, R. F. ",
                                    React.createElement("span", { style: { fontStyle: 'italic' } }, "A simple method for displaying the hydropathic character of a protein."),
                                    "J. Mol. Biol. 157, 105\u2013132 (1982)")))),
                    React.createElement("div", { className: 'col-md-6' },
                        React.createElement("h2", { className: 'featurette-heading' }, "Polarity"),
                        React.createElement("p", { style: justify }, "Polarity is the property of a molecule given by the separation of electric charge, leading to the molecule having electric poles. Generally speaking, polar molecules are hydrophilic, while non polar molecules are usually hydrophobic, but there can be exceptions. In the terms of amino acids residues, hydrophilic/polar and hydrophobic/non polar can be considered as synonyms."),
                        React.createElement("p", null, "The scale ranges from 0 for small aliphatic amino acids (Ala, Gly) to 51.6 (His)."),
                        React.createElement("p", { style: reference },
                            React.createElement("small", null,
                                React.createElement("a", { target: '_blank', href: 'https://dx.doi.org/10.1016/0022-5193(68)90069-6' },
                                    "Zimmerman, J. M., Eliezer, N. &amph; Simha, R ",
                                    React.createElement("span", { style: { fontStyle: 'italic' } }, "The characterization of amino acid sequences in proteins by statistical methods."),
                                    "J. Theor. Biol. 21, 170\u2013201 (1968)."))))),
                React.createElement("div", { className: 'row' },
                    React.createElement("div", { className: 'col-md-6' },
                        React.createElement("h2", { className: 'featurette-heading' }, "Mutability"),
                        React.createElement("p", { style: justify }, "Relative mutability quantifies the tendency of an amino acid to be substituted (mutated) in a protein structure. Substitution by similar amino acids generally retains protein function, while substitution by amino acids with different properties may affect the protein structure or function. Relative mutability is high for easily substitutable amino acids, such as small polar residues and low for amino acids which play a significant role in protein structure, i.e. substrate binding or catalytic activity. Alanine has a normalized value of 100."),
                        React.createElement("p", { style: reference },
                            React.createElement("small", null,
                                React.createElement("a", { target: '_blank', href: 'https://dx.doi.org/10.1093/bioinformatics/8.3.275' },
                                    "Jones, D. T., Taylor, W. R. &amph; Thornton, J. M. ",
                                    React.createElement("span", { style: { fontStyle: 'italic' } }, "The rapid generation of mutation data matrices from protein sequences."),
                                    "Bioinformatics 8, 275\u2013282 (1992)")))),
                    React.createElement("div", { className: 'col-md-6' },
                        React.createElement("h2", { className: 'featurette-heading' }, "Charge"),
                        React.createElement("p", { style: justify }, "Some amino acids can be (de)protonated based on the pH and, therefore, charged. At physiological pH, lysine and arginine are positively charged, whereas aspartic and glutamic acids are negatively charged. On the other hand, the protonation state of histidine is dependent on its micro-environment. In this study, all histidines are treated as positively charged."),
                        React.createElement("p", null, "Charge property is a sum of all positively and negatively charged amino acids.")),
                    React.createElement("div", { style: { marginTop: 30 }, className: 'row table-responsive col-md-8 col-md-offset-2' },
                        React.createElement("table", { className: 'table table-condensed active' },
                            React.createElement("thead", null,
                                React.createElement("tr", null,
                                    React.createElement("th", null, "Residue"),
                                    React.createElement("th", null, "Charge"),
                                    React.createElement("th", null, "Hydropathy"),
                                    React.createElement("th", null, "Polarity"),
                                    React.createElement("th", null, "Mutability"))),
                            React.createElement("tbody", null,
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Ala"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "1.8"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "100")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Arg"),
                                    React.createElement("td", null, "1"),
                                    React.createElement("td", null, "-4.5"),
                                    React.createElement("td", null, "52"),
                                    React.createElement("td", null, "83")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Asn"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "-3.5"),
                                    React.createElement("td", null, "3.38"),
                                    React.createElement("td", null, "104")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Asp"),
                                    React.createElement("td", null, "-1"),
                                    React.createElement("td", null, "-3.5"),
                                    React.createElement("td", null, "49.7"),
                                    React.createElement("td", null, "86")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Cys"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "2.5"),
                                    React.createElement("td", null, "1.48"),
                                    React.createElement("td", null, "44")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Glu"),
                                    React.createElement("td", null, "-1"),
                                    React.createElement("td", null, "-3.5"),
                                    React.createElement("td", null, "49.9"),
                                    React.createElement("td", null, "77")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Gln"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "-3.5"),
                                    React.createElement("td", null, "3.53"),
                                    React.createElement("td", null, "84")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Gly"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "-0.4"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "50")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "His"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "-3.2"),
                                    React.createElement("td", null, "51.6"),
                                    React.createElement("td", null, "91")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Ile"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "4.5"),
                                    React.createElement("td", null, "0.13"),
                                    React.createElement("td", null, "103")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Leu"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "3.8"),
                                    React.createElement("td", null, "0.13"),
                                    React.createElement("td", null, "54")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Lys"),
                                    React.createElement("td", null, "1"),
                                    React.createElement("td", null, "-3.9"),
                                    React.createElement("td", null, "49.5"),
                                    React.createElement("td", null, "72")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Met"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "1.9"),
                                    React.createElement("td", null, "1.43"),
                                    React.createElement("td", null, "93")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Phe"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "2.8"),
                                    React.createElement("td", null, "0.35"),
                                    React.createElement("td", null, "51")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Pro"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "-1.6"),
                                    React.createElement("td", null, "1.58"),
                                    React.createElement("td", null, "58")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Ser"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "-0.8"),
                                    React.createElement("td", null, "1.67"),
                                    React.createElement("td", null, "117")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Thr"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "-0.7"),
                                    React.createElement("td", null, "1.66"),
                                    React.createElement("td", null, "107")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Trp"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "-0.9"),
                                    React.createElement("td", null, "2.1"),
                                    React.createElement("td", null, "25")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Tyr"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "-1.3"),
                                    React.createElement("td", null, "1.61"),
                                    React.createElement("td", null, "50")),
                                React.createElement("tr", null,
                                    React.createElement("td", null, "Val"),
                                    React.createElement("td", null, "0"),
                                    React.createElement("td", null, "4.2"),
                                    React.createElement("td", null, "0.13"),
                                    React.createElement("td", null, "98")))))),
                React.createElement(ChannelsDB.ScrollButton, { scrollStepInPx: '50', delayInMs: '10' }));
        };
        return Methods;
    }(React.Component));
    ChannelsDB.Methods = Methods;
})(ChannelsDB || (ChannelsDB = {}));
var ChannelsDB;
(function (ChannelsDB) {
    var ScrollButton = (function (_super) {
        __extends(ScrollButton, _super);
        function ScrollButton() {
            var _this = _super.call(this) || this;
            _this.state = {
                intervalId: 0,
                showArrow: false,
            };
            _this.state = {
                intervalId: 0,
                showArrow: false,
            };
            return _this;
        }
        ScrollButton.prototype.componentDidMount = function () {
            var _this = this;
            var subj = new Rx.BehaviorSubject(false);
            var onscroll = function () { return subj.onNext(window.scrollY > 0); };
            window.onscroll = onscroll;
            document.onscroll = onscroll;
            subj.debounce(250).subscribe(function (showArrow) { return _this.setState({ showArrow: showArrow }); });
        };
        ScrollButton.prototype.scrollStep = function () {
            if (window.pageYOffset === 0) {
                clearInterval(this.state.intervalId);
            }
            window.scroll(0, window.pageYOffset - this.props.scrollStepInPx);
        };
        ScrollButton.prototype.scrollToTop = function () {
            var intervalId = setInterval(this.scrollStep.bind(this), this.props.delayInMs);
            this.setState({ intervalId: intervalId });
        };
        ScrollButton.prototype.render = function () {
            var _this = this;
            return React.createElement("button", { title: 'Back to top', className: 'bloc-button btn btn-d btnScrollToTop', style: { display: this.state.showArrow ? 'block' : 'none' }, onClick: function () { _this.scrollToTop(); } },
                React.createElement("span", { className: 'glyphicon glyphicon-chevron-up' }));
        };
        return ScrollButton;
    }(React.Component));
    ChannelsDB.ScrollButton = ScrollButton;
})(ChannelsDB || (ChannelsDB = {}));
/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var ChannelsDB;
(function (ChannelsDB) {
    function updateViewState(state, viewState) {
        state.viewState = viewState;
        state.stateUpdated.onNext(void 0);
    }
    ChannelsDB.updateViewState = updateViewState;
    function initState() {
        var state = {
            dbContent: void 0,
            dbContentAvailable: new Rx.BehaviorSubject(false),
            statistics: void 0,
            statisticsAvailable: new Rx.BehaviorSubject(void 0),
            searchedTerm: '',
            searchTerm: new Rx.Subject(),
            viewState: { kind: 'Info' },
            stateUpdated: new Rx.Subject(),
            fullSearch: new Rx.Subject(),
            channelsUrl: "https://channelsdb2.biodata.ceitec.cz/api",
        };
        var interrupt = Rx.Observable.merge(state.searchTerm, state.fullSearch);
        state.searchTerm
            .do(function () { return ChannelsDB.RequestPool.abort('data'); })
            .map(function (t) { return t.trim(); })
            .distinctUntilChanged()
            .concatMap(function (t) { return Rx.Observable.timer(250).takeUntil(interrupt).map(function (_) { return t; }); })
            .forEach(function (t) {
            if (t.length > 2) {
                search(state, t).takeUntil(interrupt).subscribe(function (data) { state.searchedTerm = t; updateViewState(state, { kind: 'Searched', data: data }); }, function (err) { if (err !== 'Aborted')
                    updateViewState(state, { kind: 'Error', message: '' + err }); });
            }
            else {
                updateViewState(state, { kind: 'Info' });
            }
        });
        initSearch(state);
        getStatistics(state);
        return state;
    }
    ChannelsDB.initState = initState;
    function initSearch(state) {
        return __awaiter(this, void 0, void 0, function () {
            var content, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, ChannelsDB.ajaxGetJson(state.channelsUrl + "/content")];
                    case 1:
                        content = _a.sent();
                        state.dbContent = { pdb: content.PDB, alphafill: content.AlphaFill };
                        state.dbContentAvailable.onNext(true);
                        return [3 /*break*/, 3];
                    case 2:
                        e_4 = _a.sent();
                        setTimeout(function () { return initSearch(state); }, 2000);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function getStatistics(state) {
        return __awaiter(this, void 0, void 0, function () {
            var content, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (state.statistics) {
                            state.statisticsAvailable.onNext(state.statistics);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, ChannelsDB.ajaxGetJson(state.channelsUrl + "/statistics")];
                    case 1:
                        content = _a.sent();
                        state.statistics = content;
                        state.statisticsAvailable.onNext(content);
                        return [3 /*break*/, 3];
                    case 2:
                        e_5 = _a.sent();
                        setTimeout(function () { return getStatistics(state); }, 2000);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function sortSearchData(state, data) {
    }
    function search(state, term) {
        ChannelsDB.RequestPool.abort('data');
        updateViewState(state, { kind: 'Loading', message: 'Searching...' });
        var s = new Rx.Subject();
        ChannelsDB.ajaxGetJson("https://www.ebi.ac.uk/pdbe/search/pdb-autocomplete/select?rows=1000000&json.nl=map&group=true&group.field=category&group.limit=28&fl=value,num_pdb_entries,var_name&sort=category+asc,num_pdb_entries+desc&q=value:" + encodeURIComponent("\"" + term + "*\"") + "~10&wt=json", 'data')
            .then(function (data) { s.onNext(data); s.onCompleted(); })
            .catch(function (err) { s.onError(err); s.onCompleted(); });
        return s;
    }
    function searchPdbCategory(term, var_name, start) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ChannelsDB.RequestPool.abort('data');
                        return [4 /*yield*/, ChannelsDB.ajaxGetJson("https://www.ebi.ac.uk/pdbe/search/pdb-autocomplete/select?rows=28&start=" + start + "&json.nl=map&group.limit=-1&fl=value,num_pdb_entries,var_name&sort=category+asc,num_pdb_entries+desc&fq=var_name:" + var_name + "&q=value:" + encodeURIComponent("\"" + term + "*\"") + "~10&wt=json", 'data')];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data.response.docs];
                }
            });
        });
    }
    ChannelsDB.searchPdbCategory = searchPdbCategory;
    var ROW_COUNT = 1000000;
    var toLowerCache = {};
    function toLower(str) {
        var ret = toLowerCache[str];
        if (ret)
            return ret;
        ret = str.toLowerCase();
        toLowerCache[str] = ret;
        return ret;
    }
    ChannelsDB.toLower = toLower;
    function sortGroups(state, groups) {
        var withChannels = [], withoutChannels = [];
        var content = state.dbContent.pdb; //TODO set also alphafill
        for (var _i = 0, groups_1 = groups; _i < groups_1.length; _i++) {
            var group = groups_1[_i];
            if (content[toLower(group.doclist.docs[0].pdb_id)])
                withChannels.push(group);
            else
                withoutChannels.push(group);
        }
        return { entries: withChannels.concat(withoutChannels), withCount: withChannels.length, withoutCount: withoutChannels.length };
    }
    function fetchPdbEntries(state, var_name, value) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, ChannelsDB.ajaxGetJson("https://www.ebi.ac.uk/pdbe/search/pdb/select?q=*:*&group=true&group.field=pdb_id&start=" + 0 + "&rows=" + ROW_COUNT + "&group.ngroups=true&fl=pdb_id,title,experimental_method,organism_scientific_name,resolution,entry_organism_scientific_name&json.nl=map&fq=" + encodeURIComponent(var_name) + ":\"" + encodeURIComponent(value) + "\"&sort=overall_quality+desc&wt=json", 'data')];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, sortGroups(state, data.grouped.pdb_id.groups)];
                }
            });
        });
    }
    ChannelsDB.fetchPdbEntries = fetchPdbEntries;
    function fetchPdbText(state, value) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ChannelsDB.RequestPool.abort('data');
                        return [4 /*yield*/, ChannelsDB.ajaxGetJson("https://www.ebi.ac.uk/pdbe/search/pdb/select?q=*:*&group=true&group.field=pdb_id&start=" + 0 + "&rows=" + ROW_COUNT + "&group.ngroups=true&fl=pdb_id,title,experimental_method,organism_scientific_name,resolution,entry_organism_scientific_name&json.nl=map&fq=text:\"" + encodeURIComponent(value) + "\"&sort=overall_quality+desc&wt=json", 'data')];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, sortGroups(state, data.grouped.pdb_id.groups)];
                }
            });
        });
    }
    ChannelsDB.fetchPdbText = fetchPdbText;
})(ChannelsDB || (ChannelsDB = {}));
/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var ChannelsDB;
(function (ChannelsDB) {
    'use strict';
    function readData(data) {
        return new Promise(function (resolve, reject) {
            data.onerror = function (e) {
                var error = e.target.error;
                reject(error ? error : 'Failed.');
            };
            data.onabort = function () { return reject('Aborted'); };
            data.onload = function (e) { return resolve(e); };
        });
    }
    var RequestPool = (function () {
        function RequestPool() {
        }
        RequestPool.get = function (key) {
            var ret = this.pool.length ? this.pool.pop() : new XMLHttpRequest();
            var arr = (this.pending[key || '__empty__'] || []);
            arr.push(ret);
            this.pending[key || '__empty__'] = arr;
            return ret;
        };
        RequestPool.abort = function (key) {
            var arr = this.pending[key];
            if (!arr)
                return;
            for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
                var a = arr_1[_i];
                try {
                    a.abort();
                }
                catch (e) { }
            }
        };
        RequestPool.emptyFunc = function () { };
        RequestPool.removePending = function (req) {
            for (var _i = 0, _a = Object.getOwnPropertyNames(this.pending); _i < _a.length; _i++) {
                var p = _a[_i];
                var arr = this.pending[p];
                if (!arr)
                    continue;
                var idx = 0;
                for (var _b = 0, arr_2 = arr; _b < arr_2.length; _b++) {
                    var a = arr_2[_b];
                    if (a === req) {
                        arr[idx] = arr[arr.length - 1];
                        arr.pop();
                        return;
                    }
                    idx++;
                }
            }
        };
        RequestPool.deposit = function (req) {
            if (this.pool.length < this.poolSize) {
                req.onabort = RequestPool.emptyFunc;
                req.onerror = RequestPool.emptyFunc;
                req.onload = RequestPool.emptyFunc;
                req.onprogress = RequestPool.emptyFunc;
                this.removePending(req);
                this.pool.push(req);
            }
        };
        RequestPool.pool = [];
        RequestPool.poolSize = 15;
        RequestPool.pending = {};
        return RequestPool;
    }());
    ChannelsDB.RequestPool = RequestPool;
    function processAjax(e) {
        var req = e.target;
        if (req.status >= 200 && req.status < 400) {
            var text = JSON.parse(e.target.responseText);
            RequestPool.deposit(e.target);
            return text;
        }
        else {
            var status_1 = req.statusText;
            RequestPool.deposit(e.target);
            throw status_1;
        }
    }
    function ajaxGetJson(url, key) {
        return __awaiter(this, void 0, void 0, function () {
            var xhttp, e;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        xhttp = RequestPool.get(key);
                        xhttp.open('get', url, true);
                        xhttp.responseType = 'text';
                        xhttp.send();
                        return [4 /*yield*/, readData(xhttp)];
                    case 1:
                        e = _a.sent();
                        return [2 /*return*/, processAjax(e)];
                }
            });
        });
    }
    ChannelsDB.ajaxGetJson = ajaxGetJson;
})(ChannelsDB || (ChannelsDB = {}));
