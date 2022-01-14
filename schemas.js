const BaseJoi = require('joi');
const sanitizeHtml=require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension)

module.exports.blogSchema = Joi.object({
    posts:Joi.object({
        title: Joi.string().required().escapeHTML(),
        image: Joi.string().allow('').optional().escapeHTML(),
        content: Joi.string().required().escapeHTML()
    }).required(),
    deleteImages:Joi.array()
});

module.exports.commentSchema = Joi.object({
    comment:Joi.object({
        body:Joi.string().max(63).required().escapeHTML()
    }).required()
})

