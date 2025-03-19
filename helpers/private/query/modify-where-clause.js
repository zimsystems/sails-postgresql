// ███╗   ███╗ ██████╗ ██████╗ ██╗███████╗██╗   ██╗    ██╗    ██╗██╗  ██╗███████╗██████╗ ███████╗
// ████╗ ████║██╔═══██╗██╔══██╗██║██╔════╝╚██╗ ██╔╝    ██║    ██║██║  ██║██╔════╝██╔══██╗██╔════╝
// ██╔████╔██║██║   ██║██║  ██║██║█████╗   ╚████╔╝     ██║ █╗ ██║███████║█████╗  ██████╔╝█████╗
// ██║╚██╔╝██║██║   ██║██║  ██║██║██╔══╝    ╚██╔╝      ██║███╗██║██╔══██║██╔══╝  ██╔══██╗██╔══╝
// ██║ ╚═╝ ██║╚██████╔╝██████╔╝██║██║        ██║       ╚███╔███╔╝██║  ██║███████╗██║  ██║███████╗
// ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚═╝╚═╝        ╚═╝        ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝

//  ██████╗██╗      █████╗ ██╗   ██╗███████╗███████╗
// ██╔════╝██║     ██╔══██╗██║   ██║██╔════╝██╔════╝
// ██║     ██║     ███████║██║   ██║███████╗█████╗
// ██║     ██║     ██╔══██║██║   ██║╚════██║██╔══╝
// ╚██████╗███████╗██║  ██║╚██████╔╝███████║███████╗
//  ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝

// Modify the where clause of a query object

var _ = require("@sailshq/lodash");

module.exports = function modifyWhereClause(whereClause, meta) {
  // Handle empty `where` clause
  if (_.keys(whereClause).length === 0) {
    return whereClause;
  }

  var makeLikeModifierCaseInsensitive = meta && meta.makeLikeModifierCaseInsensitive;

  // Recursively modify the `where` clause.
  var queryFilter = (function recurse(branch) {
    var loneKey = _.first(_.keys(branch));

    // Handle AND/OR conditions
    if (loneKey === "and" || loneKey === "or") {
      var conjunctsOrDisjuncts = branch[loneKey];
      branch[loneKey] = _.map(conjunctsOrDisjuncts, function (conjunctOrDisjunct) {
        return recurse(conjunctOrDisjunct);
      });

      return branch;
    }

    // We're dealing with a constraint of some kind.
    var constraintColumnName = loneKey;
    var constraint = branch[constraintColumnName];

    // If it's a primitive, return as is.
    if (_.isString(constraint) || _.isNumber(constraint) || _.isBoolean(constraint) || _.isNull(constraint)) {
      return branch;
    }

    // Modify `LIKE` to `ILIKE` if case insensitivity is enabled.
    if (constraint.like && makeLikeModifierCaseInsensitive) {
      constraint.ilike = constraint.like;
      delete constraint.like;
    }

    // convert `!= null` to `is not null`
    if (constraint['!='] === null) {
      constraint['is not'] = null;
      delete constraint['!='];
    }

    return branch;
  })(whereClause);

  // Return the modified query filter.
  return queryFilter;
};
