import { createNamespace } from '../utils';

const [createComponent, bem] = createNamespace('form');

export default createComponent({
  props: {
    labelWidth: [Number, String],
    labelAlign: String,
    inputAlign: String,
    validateFirst: Boolean,
    errorMessageAlign: Boolean,
  },

  provide() {
    return {
      vanForm: this,
    };
  },

  data() {
    return {
      fields: [],
    };
  },

  methods: {
    validateSeq() {
      return new Promise((resolve, reject) => {
        const errors = [];

        this.fields
          .reduce(
            (promise, field) =>
              promise.then(() => {
                if (!errors.length) {
                  return field.validate().then(error => {
                    if (error) {
                      errors.push(error);
                    }
                  });
                }
              }),
            Promise.resolve()
          )
          .then(() => {
            if (errors.length) {
              reject(errors);
            } else {
              resolve();
            }
          });
      });
    },

    validateAll() {
      return new Promise((resolve, reject) => {
        Promise.all(this.fields.map(item => item.validate())).then(errors => {
          errors = errors.filter(item => item);

          if (errors.length) {
            reject(errors);
          } else {
            resolve();
          }
        });
      });
    },

    // @exposed-api
    validate(name) {
      if (name) {
        return this.validateField(name);
      }
      return this.validateFirst ? this.validateSeq() : this.validateAll();
    },

    validateField(name) {
      const matched = this.fields.filter(item => item.name === name);

      if (matched.length) {
        return new Promise((resolve, reject) => {
          matched[0].validate().then(error => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      }

      return Promise.reject();
    },

    // @exposed-api
    resetValidation(name) {
      this.fields.forEach(item => {
        if (!name || item.name === name) {
          item.resetValidation();
        }
      });
    },

    getValues() {
      return this.fields.reduce((form, field) => {
        form[field.name] = field.formValue;
        return form;
      }, {});
    },

    onSubmit(event) {
      event.preventDefault();
      this.submit();
    },

    // @exposed-api
    submit() {
      const values = this.getValues();

      this.validate()
        .then(() => {
          this.$emit('submit', values);
        })
        .catch(errors => {
          this.$emit('failed', {
            values,
            errors,
          });
        });
    },
  },

  render() {
    return (
      <form class={bem()} onSubmit={this.onSubmit}>
        {this.slots()}
      </form>
    );
  },
});
