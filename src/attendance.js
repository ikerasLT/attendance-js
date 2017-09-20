/*!
 * Attendance v0.1
 * (c) 2017 Viktoras Morkūnas
 *
 * ---------------------------
 * Initialize by $(calendar).attendance(config);
 *
 * Dependencies: jQuery, moment
 *
 * Configs:
 * start: optional start date (moment parseable)
 * resources: array or resources
 * data: resource => [dates] object of absence days
 * url: data source url for month change
 *
 * use .attendance-next[data-calendar="calendar.id"] for next binding
 * use .attendance-prev[data-calendar="calendar.id"] for prev binding
 * use .attendance-filter[data-calendar="calendar.id"] for resource filter binding
 */

$.fn.attendance = function(config) {

    var calendar = $(this);
    var resources = config.resources;
    var start = moment(config.start).startOf('month');
    var end = start.clone().endOf('month');
    var data = config.data;
    var url = config.url;
    var label = config.label;
    var filter = {};
    var filteredResources = Object.values(resources);

    function render() {
        calendar.html(renderTable());
    }

    function renderTable() {
        return '' +
            '<div class="table-responsive">' +
            '<table class="table table-bordered">' +
            renderHeader() +
            renderRows() +
            '</table>' +
            '</div>';
    }

    function renderHeader() {
        var mStart = start.clone().subtract(1, 'days');
        var mEnd = end.clone().add(1, 'days');

        return '' +
            '<tr>' +
            '<td class="text-center" colspan="' + moment.duration(mEnd.diff(mStart)).asDays() + '">' +
            start.format('MMMM') +
            '</td>' +
            '<tr>' +
            renderHeaderCells() +
            '</tr>';
    }

    function renderHeaderCells() {
        var cells = '<td id="attendance-loader"></td>';

        for (var i = start.clone(); i <= end; i.add(1, 'days')) {
            cells += '' +
                '<td>' +
                i.format('DD') +
                '</td>';
        }

        return cells;
    }

    function renderRows() {
        rows = '';

        for (i in resources) {
            if ($.inArray(resources[i], filteredResources) !== -1) {
                rows += '' +
                    '<tr>' +
                    '<td>' + resources[i][label] + '</td>' +
                    renderCells(i) +
                    '</tr>';
            }
        }

        return rows;
    }

    function renderCells(resource) {
        var cells = '';

        for (var i = start.clone(); i <= end; i.add(1, 'days')) {
            cells += '' +
                '<td>' +
                (data[resource].indexOf(i.format('YYYY-MM-DD')) !== -1 ? 'n' : '') +
                '</td>';
        }

        return cells;
    }

    function updateTable() {
        addLoader();
        $.ajax({
            url: url,
            data: {start: start.format('YYYY-MM-DD')},
            dataType: 'json',
            success: function (response) {
                data = response;

                render();
                removeLoader();
            }
        });
    }

    function reset() {
        for (i in resources) {
            data[i] = [];
        }
        render();
    }

    function nextMonth() {
        start.add(1, 'month').startOf('month');
        end.add(1, 'month').endOf('month');
        reset();

        updateTable();
    }

    function prevMonth() {
        start.subtract(1, 'month').startOf('month');
        end.subtract(1, 'month').endOf('month');
        reset();

        updateTable()
    }

    function addLoader() {
        var loader = '<span class="text-warning">Loading...</span>';

        calendar.find('#attendance-loader').html(loader);
    }

    function removeLoader() {
        calendar.find('#attendance-loader').html('');
    }

    function search(needle, haystack) {
        if (typeof haystack === 'string') {
            if (haystack.toLowerCase().search(needle.toLowerCase()) !== -1) {
                return true;
            }
        } else if (haystack instanceof Array) {
            for (i in haystack) {
                if (search(needle, haystack[i])) {
                    return true;
                }
            }

            return false;
        } else {
            if (haystack == needle) {
                return true;
            }
        }

        return false
    }

    function filterResources() {
        filter[$(this).data('filter')] = $(this).val();

        filteredResources = [];

        $.each(resources, function (key, resource) {
            var show = true;

            for (var property in filter) {
                if (filter.hasOwnProperty(property) && filter[property]) {
                    if (! search(filter[property], resource[property])) {
                        show = false
                    }
                }
            }

            if (show) {
                filteredResources.push(resource);
            }
        });
        render();
    }

    render();

    $('.attendance-next[data-calendar="' + calendar.attr('id') + '"]').click(nextMonth);
    $('.attendance-prev[data-calendar="' + calendar.attr('id') + '"]').click(prevMonth);
    $('.attendance-filter[data-calendar="' + calendar.attr('id') + '"]').keyup(filterResources);
    $('.attendance-filter[data-calendar="' + calendar.attr('id') + '"]').change(filterResources);

    return {
        next: nextMonth,
        prev: prevMonth
    }
};
